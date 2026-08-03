import { Router, Request, Response } from 'express';
import multer from 'multer';
import { query } from '../db';
import { createInterview, getInterview, getMessages, processAnswer, finishInterview, generateQuestion } from '../services/interview';
import { ROLES } from '../types';
import { CreateInterviewSchema } from '../schemas';
import { generateId } from '../types';
import fs from 'fs';
import path from 'path';
import { getConfig, audioSpeech } from '../services/routerai';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_AUDIO_SIZE_MB || '20') * 1024 * 1024,
  },
});

// GET /api/roles
router.get('/roles', (req: Request, res: Response) => {
  return res.json(Object.entries(ROLES).map(([id, role]) => ({
    id,
    title: role.title,
  })));
});

// POST /api/interviews
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateInterviewSchema.parse(req.body);
    const interview = await createInterview(parsed.role);

    // Generate greeting message
    const greetingMsgId = generateId();
    const greetingText = `Здравствуйте! Я голосовой AI-рекрутер. Я проведу собеседование на позицию "${ROLES[parsed.role].title}", задам несколько вопросов и подготовлю итоговую оценку.`;

    await query(
      'INSERT INTO messages (id, interview_id, role, text, message_type, question_number) VALUES ($1, $2, $3, $4, $5, $6)',
      [greetingMsgId, interview.id, 'assistant', greetingText, 'greeting', 0]
    );

    // Generate first question
    const messages = await getMessages(interview.id);
    const result = await generateQuestion(parsed.role, messages, 1);

    const questionMsgId = generateId();
    await query(
      'INSERT INTO messages (id, interview_id, role, text, message_type, question_number) VALUES ($1, $2, $3, $4, $5, $6)',
      [questionMsgId, interview.id, 'assistant', result.recruiterMessage, 'question', 1]
    );

    // Update question count
    await query('UPDATE interviews SET question_count = 1 WHERE id = $1', [interview.id]);

    // TTS for greeting and first question
    let greetingAudioUrl: string | null = null;
    let audioUrl: string | null = null;
    try {
      const settingsRow = (await query('SELECT * FROM settings WHERE id = 1')).rows[0];
      if (settingsRow?.encrypted_api_key) {
        const config = getConfig(
          { encrypted: settingsRow.encrypted_api_key, iv: settingsRow.encryption_iv, tag: settingsRow.encryption_tag },
          settingsRow.base_url
        );
        if (config) {
          const ttsModel = process.env.ROUTERAI_TTS_MODEL || 'microsoft/mai-voice-2-flash';
          const ttsVoice = process.env.ROUTERAI_TTS_VOICE || 'ru-RU-Masha:MAI-Voice-2-Flash';
          const audioDir = path.join(__dirname, '..', '..', 'audio');
          if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

          // Greeting TTS
          try {
            const greetingAudioBuf = await audioSpeech(config, ttsModel, greetingText, ttsVoice);
            const greetingAudioFilename = `${greetingMsgId}.mp3`;
            fs.writeFileSync(path.join(audioDir, greetingAudioFilename), greetingAudioBuf);
            greetingAudioUrl = `/api/audio/${greetingMsgId}.mp3`;
            await query('UPDATE messages SET audio_reference = $1 WHERE id = $2', [greetingAudioFilename, greetingMsgId]);
          } catch (err) {
            console.warn('TTS error on greeting:', (err as Error).message);
          }

          // First question TTS
          try {
            const audioBuf = await audioSpeech(config, ttsModel, result.recruiterMessage, ttsVoice);
            const audioFilename = `${questionMsgId}.mp3`;
            fs.writeFileSync(path.join(audioDir, audioFilename), audioBuf);
            audioUrl = `/api/audio/${questionMsgId}.mp3`;
            await query('UPDATE messages SET audio_reference = $1 WHERE id = $2', [audioFilename, questionMsgId]);
          } catch (err) {
            console.warn('TTS error on first question:', (err as Error).message);
          }
        }
      }
    } catch (err) {
      console.warn('TTS config error:', (err as Error).message);
    }

    return res.json({
      interviewId: interview.id,
      status: 'in_progress',
      questionNumber: 1,
      plannedQuestionCount: parseInt(process.env.INTERVIEW_TARGET_QUESTIONS || '7'),
      greetingId: greetingMsgId,
      greetingAudioUrl,
      message: {
        id: questionMsgId,
        role: 'assistant',
        text: result.recruiterMessage,
        audioUrl,
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Некорректные данные', details: err.errors });
    }
    console.error('Create interview error:', err);
    return res.status(500).json({ error: 'Ошибка создания интервью' });
  }
});

// GET /api/interviews/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const interview = await getInterview(req.params.id);
    if (!interview) {
      return res.status(404).json({ error: 'Интервью не найдено' });
    }
    const messages = await getMessages(req.params.id);
    return res.json({
      ...interview,
      messages,
    });
  } catch (err) {
    console.error('Get interview error:', err);
    return res.status(500).json({ error: 'Ошибка получения интервью' });
  }
});

// POST /api/interviews/:id/answers
router.post('/:id/answers', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Аудиофайл не предоставлен' });
    }

    if (req.file.size < 100) {
      return res.status(400).json({ error: 'Слишком короткая запись' });
    }

    const result = await processAnswer(
      req.params.id,
      req.file.buffer,
      req.file.mimetype
    );

    return res.json(result);
  } catch (err: any) {
    if (err.message === 'empty_transcript') {
      return res.status(400).json({ error: 'Не удалось распознать речь. Попробуйте записать ответ ещё раз.', emptyTranscript: true });
    }
    console.error('Answer processing error:', err);
    return res.status(500).json({ error: 'Ошибка обработки ответа' });
  }
});

// POST /api/interviews/:id/finish
router.post('/:id/finish', async (req: Request, res: Response) => {
  try {
    const result = await finishInterview(req.params.id);
    return res.json(result);
  } catch (err: any) {
    console.error('Finish interview error:', err);
    return res.status(500).json({ error: 'Ошибка завершения интервью' });
  }
});

// POST /api/interviews/:id/messages/:messageId/speech
router.post('/:id/messages/:messageId/speech', async (req: Request, res: Response) => {
  try {
    const msgResult = await query('SELECT * FROM messages WHERE id = $1 AND interview_id = $2', [req.params.messageId, req.params.id]);
    const message = msgResult.rows[0];
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }

    const settingsRow = (await query('SELECT * FROM settings WHERE id = 1')).rows[0];
    if (!settingsRow?.encrypted_api_key) {
      return res.status(400).json({ error: 'API-ключ не настроен' });
    }

    const config = getConfig(
      { encrypted: settingsRow.encrypted_api_key, iv: settingsRow.encryption_iv, tag: settingsRow.encryption_tag },
      settingsRow.base_url
    );
    if (!config) {
      return res.status(400).json({ error: 'Не удалось расшифровать API-ключ' });
    }

    const ttsModel = process.env.ROUTERAI_TTS_MODEL || 'microsoft/mai-voice-2-flash';
    const ttsVoice = process.env.ROUTERAI_TTS_VOICE || 'ru-RU-Masha:MAI-Voice-2-Flash';
    const audioBuf = await audioSpeech(config, ttsModel, message.text, ttsVoice);

    const audioDir = path.join(__dirname, '..', '..', 'audio');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    const audioFilename = `${message.id}.mp3`;
    fs.writeFileSync(path.join(audioDir, audioFilename), audioBuf);
    await query('UPDATE messages SET audio_reference = $1 WHERE id = $2', [audioFilename, message.id]);

    return res.json({ audioUrl: `/api/audio/${message.id}.mp3` });
  } catch (err) {
    console.error('Speech generation error:', err);
    return res.status(500).json({ error: 'Ошибка генерации речи' });
  }
});

export default router;