import { query } from '../db';
import { chatCompletions, audioTranscriptions, audioSpeech, getConfig } from './routerai';
import { generateId } from '../types';
import fs from 'fs';
import path from 'path';
import { buildSystemPrompt } from '../prompts/common';
import { PYTHON_DEVELOPER_PROMPT } from '../prompts/python-developer';
import { SALES_MANAGER_PROMPT } from '../prompts/sales-manager';
import { HR_MANAGER_PROMPT } from '../prompts/hr-manager';
import { MARKETER_PROMPT } from '../prompts/marketer';
import { ANALYST_PROMPT } from '../prompts/analyst';
import { CSHARP_DEVELOPER_PROMPT } from '../prompts/csharp-developer';
import { LLMResponseSchema } from '../schemas';

const ROLE_PROMPTS: Record<string, string> = {
  'python-developer': PYTHON_DEVELOPER_PROMPT,
  'sales-manager': SALES_MANAGER_PROMPT,
  'hr-manager': HR_MANAGER_PROMPT,
  'marketer': MARKETER_PROMPT,
  'analyst': ANALYST_PROMPT,
  'csharp-developer': CSHARP_DEVELOPER_PROMPT,
};

const MIN_QUESTIONS = parseInt(process.env.INTERVIEW_MIN_QUESTIONS || '5');
const TARGET_QUESTIONS = parseInt(process.env.INTERVIEW_TARGET_QUESTIONS || '7');
const MAX_QUESTIONS = parseInt(process.env.INTERVIEW_MAX_QUESTIONS || '10');

export async function createInterview(role: string) {
  const id = generateId();
  await query(
    'INSERT INTO interviews (id, role, question_count, planned_question_count) VALUES ($1, $2, 0, $3)',
    [id, role, TARGET_QUESTIONS]
  );
  return { id, role };
}

export async function getInterview(id: string) {
  const result = await query('SELECT * FROM interviews WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getMessages(interviewId: string) {
  const result = await query(
    'SELECT * FROM messages WHERE interview_id = $1 ORDER BY created_at ASC, id ASC',
    [interviewId]
  );
  return result.rows;
}

export async function getSettings() {
  const result = await query('SELECT * FROM settings WHERE id = 1');
  return result.rows[0] || null;
}

export async function generateQuestion(role: string, messages: any[], questionNumber: number): Promise<{
  recruiterMessage: string;
  shouldFinish: boolean;
  report?: any;
}> {
  const rolePrompt = ROLE_PROMPTS[role] || PYTHON_DEVELOPER_PROMPT;
  const systemPrompt = buildSystemPrompt(rolePrompt, questionNumber, MIN_QUESTIONS, MAX_QUESTIONS);

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
    {
      role: 'system',
      content: `Сейчас ты должен задать вопрос №${questionNumber}. Всего можно задать от ${MIN_QUESTIONS} до ${MAX_QUESTIONS} вопросов.

Ответь строго в одном из двух форматов JSON:

1. Если задаёшь вопрос:
{
  "type": "question",
  "questionNumber": ${questionNumber},
  "recruiterMessage": "текст вопроса",
  "answerAssessment": {
    "relevance": 7,
    "depth": 7,
    "clarity": 7,
    "summary": "краткая оценка предыдущего ответа"
  },
  "shouldFinish": false
}

2. Если интервью завершено (вопрос №${questionNumber} > ${MAX_QUESTIONS}):
{
  "type": "final",
  "recruiterMessage": "текст завершения",
  "shouldFinish": true,
  "report": {
    "overallScore": 7,
    "strengths": ["сильная сторона 1"],
    "weaknesses": ["слабая сторона 1"],
    "developmentRecommendations": ["рекомендация 1"],
    "hiringRecommendation": "можно рассмотреть",
    "recommendationReason": "обоснование",
    "insufficientData": false
  }
}

Верни ТОЛЬКО JSON, без пояснений и markdown-разметки.`,
    },
  ];

  const settings = await getSettings();
  if (!settings) throw new Error('Настройки не найдены');

  const config = getConfig(
    { encrypted: settings.encrypted_api_key, iv: settings.encryption_iv, tag: settings.encryption_tag },
    settings.base_url
  );
  if (!config) throw new Error('API-ключ не настроен');

  const llmModel = process.env.ROUTERAI_LLM_MODEL || 'openai/gpt-5.6-luna';

  // Try up to 2 times for JSON parsing
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rawResponse = await chatCompletions(config, llmModel, llmMessages);

      // Clean markdown wrapper if present
      let cleaned = rawResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      const validated = LLMResponseSchema.parse(parsed);

      if (validated.type === 'question') {
        return {
          recruiterMessage: validated.recruiterMessage,
          shouldFinish: validated.shouldFinish,
        };
      } else {
        return {
          recruiterMessage: validated.recruiterMessage,
          shouldFinish: true,
          report: validated.report,
        };
      }
    } catch (err: any) {
      lastError = err;
      // On first attempt, ask to fix JSON format
      llmMessages.push({
        role: 'system',
        content: 'Предыдущий ответ был не в корректном JSON формате. Ответь строго в JSON формате, как указано в инструкции.',
      });
    }
  }

  throw new Error(`Не удалось получить корректный ответ от LLM: ${lastError?.message}`);
}

export async function processAnswer(
  interviewId: string,
  audioBuffer: Buffer,
  mimeType: string
): Promise<{
  transcript: string;
  candidateMessage: any;
  recruiterMessage: any;
  questionNumber: number;
  status: string;
  report: any | null;
}> {
  const interview = await getInterview(interviewId);
  if (!interview) throw new Error('Интервью не найдено');
  if (interview.status !== 'in_progress') throw new Error('Интервью уже завершено');

  const settings = await getSettings();
  if (!settings) throw new Error('Настройки не найдены');

  const config = getConfig(
    { encrypted: settings.encrypted_api_key, iv: settings.encryption_iv, tag: settings.encryption_tag },
    settings.base_url
  );
  if (!config) throw new Error('API-ключ не настроен');

  // 1. STT
  const sttModel = process.env.ROUTERAI_STT_MODEL || 'x-ai/grok-stt-1.0';
  const transcript = await audioTranscriptions(config, sttModel, audioBuffer, mimeType);

  if (!transcript || transcript.trim().length === 0) {
    throw new Error('empty_transcript');
  }

  // Save candidate message
  const candidateMsgId = generateId();
  await query(
    'INSERT INTO messages (id, interview_id, role, text, message_type, question_number) VALUES ($1, $2, $3, $4, $5, $6)',
    [candidateMsgId, interviewId, 'user', transcript, 'answer', interview.question_count]
  );

  const nextQuestionNumber = interview.question_count + 1;

  // If the planned question count is reached, finish the interview instead of asking more questions
  if (nextQuestionNumber > interview.planned_question_count) {
    const finishResult = await finishInterview(interviewId);
    return {
      transcript,
      candidateMessage: {
        id: candidateMsgId,
        role: 'user',
        text: transcript,
      },
      recruiterMessage: {
        id: generateId(),
        role: 'assistant',
        text: finishResult.recruiterMessage,
      },
      questionNumber: nextQuestionNumber,
      status: 'completed',
      report: finishResult.report,
    };
  }

  // 2. LLM - generate next question
  const messages = await getMessages(interviewId);

  const result = await generateQuestion(interview.role, messages, nextQuestionNumber);

  // Save recruiter message
  const recruiterMsgId = generateId();
  await query(
    'INSERT INTO messages (id, interview_id, role, text, message_type, question_number) VALUES ($1, $2, $3, $4, $5, $6)',
    [recruiterMsgId, interviewId, 'assistant', result.recruiterMessage, result.shouldFinish ? 'final' : 'question', nextQuestionNumber]
  );

  // Update question count
  await query(
    'UPDATE interviews SET question_count = $1 WHERE id = $2',
    [nextQuestionNumber, interviewId]
  );

  let audioUrl: string | null = null;

  // 3. TTS (optional - continue in text mode if fails)
  if (!result.shouldFinish) {
    try {
      const ttsModel = process.env.ROUTERAI_TTS_MODEL || 'microsoft/mai-voice-2-flash';
      const ttsVoice = process.env.ROUTERAI_TTS_VOICE || 'ru-RU-Masha:MAI-Voice-2-Flash';
      const audioBuffer = await audioSpeech(config, ttsModel, result.recruiterMessage, ttsVoice);

      const audioDir = path.join(__dirname, '..', '..', 'audio');
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      const audioFilename = `${recruiterMsgId}.mp3`;
      fs.writeFileSync(path.join(audioDir, audioFilename), audioBuffer);
      audioUrl = `/api/audio/${recruiterMsgId}.mp3`;

      // Update audio reference
      await query('UPDATE messages SET audio_reference = $1 WHERE id = $2', [audioFilename, recruiterMsgId]);
    } catch (err) {
      console.warn('TTS error, continuing in text mode:', (err as Error).message);
    }
  }

  // 4. If shouldFinish, update interview status
  if (result.shouldFinish) {
    await query(
      'UPDATE interviews SET status = $1, completed_at = NOW(), final_report = $2 WHERE id = $3',
      ['completed', JSON.stringify(result.report || null), interviewId]
    );
    if (result.report?.hiringRecommendation) {
      await query(
        'UPDATE candidates SET hiring_recommendation = $1, updated_at = NOW() WHERE interview_id = $2',
        [result.report.hiringRecommendation, interviewId]
      );
    }
  }

  return {
    transcript,
    candidateMessage: {
      id: candidateMsgId,
      role: 'user',
      text: transcript,
    },
    recruiterMessage: {
      id: recruiterMsgId,
      role: 'assistant',
      text: result.recruiterMessage,
      audioUrl,
    },
    questionNumber: nextQuestionNumber,
    status: result.shouldFinish ? 'completed' : 'in_progress',
    report: result.report || null,
  };
}

export async function finishInterview(
  interviewId: string
): Promise<{ report: any; recruiterMessage: string }> {
  const interview = await getInterview(interviewId);
  if (!interview) throw new Error('Интервью не найдено');

  const messages = await getMessages(interviewId);
  const settings = await getSettings();
  if (!settings) throw new Error('Настройки не найдены');

  const config = getConfig(
    { encrypted: settings.encrypted_api_key, iv: settings.encryption_iv, tag: settings.encryption_tag },
    settings.base_url
  );
  if (!config) throw new Error('API-ключ не настроен');

  const rolePrompt = ROLE_PROMPTS[interview.role] || PYTHON_DEVELOPER_PROMPT;
  const systemPrompt = buildSystemPrompt(rolePrompt, interview.question_count, MIN_QUESTIONS, MAX_QUESTIONS);

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    })),
    {
      role: 'system',
      content: `Интервью завершено досрочно. Сформируй итоговый отчёт на основании полученных ответов. Ответь строго в JSON:
{
  "type": "final",
  "recruiterMessage": "текст завершения",
  "shouldFinish": true,
  "report": {
    "overallScore": 7,
    "strengths": ["сильная сторона 1"],
    "weaknesses": ["слабая сторона 1"],
    "developmentRecommendations": ["рекомендация 1"],
    "hiringRecommendation": "можно рассмотреть",
    "recommendationReason": "обоснование",
    "insufficientData": false
  }
}

Верни ТОЛЬКО JSON, без пояснений и markdown-разметки.`,
    },
  ];

  const llmModel = process.env.ROUTERAI_LLM_MODEL || 'openai/gpt-5.6-luna';

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const rawResponse = await chatCompletions(config, llmModel, llmMessages);

      let cleaned = rawResponse.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      const validated = LLMResponseSchema.parse(parsed);

      if (validated.type !== 'final') {
        throw new Error('LLM не сформировал итоговый отчёт');
      }

      await query(
        'UPDATE interviews SET status = $1, completed_at = NOW(), final_report = $2 WHERE id = $3',
        ['completed', JSON.stringify(validated.report), interviewId]
      );
      if (validated.report.hiringRecommendation) {
        await query(
          'UPDATE candidates SET hiring_recommendation = $1, updated_at = NOW() WHERE interview_id = $2',
          [validated.report.hiringRecommendation, interviewId]
        );
      }

      const msgId = generateId();
      await query(
        'INSERT INTO messages (id, interview_id, role, text, message_type) VALUES ($1, $2, $3, $4, $5)',
        [msgId, interviewId, 'assistant', validated.recruiterMessage, 'final']
      );

      return { report: validated.report, recruiterMessage: validated.recruiterMessage };
    } catch (err: any) {
      lastError = err;
      llmMessages.push({
        role: 'system',
        content: 'Предыдущий ответ был не в корректном JSON формате или содержит недопустимые значения. Ответь строго в JSON формате, как указано в инструкции. Для поля hiringRecommendation используй ТОЛЬКО одно из значений: "рекомендуется к найму", "можно рассмотреть", "пока не рекомендуется".',
      });
    }
  }

  throw new Error(`Не удалось получить корректный ответ от LLM: ${lastError?.message}`);
}