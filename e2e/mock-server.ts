/**
 * Локальный mock-сервер RouterAI для E2E-тестов.
 * Поднимается на http://localhost:3001 и отвечает на:
 *  - GET  /models                → 200 (проверка подключения)
 *  - POST /chat/completions     → LLM: вопрос / итоговый отчёт
 *  - POST /audio/transcriptions → STT: транскрипция
 *  - POST /audio/speech         → TTS: валидный заглушечный .mp3
 *
 * Это позволяет детерминированно пройти полный пользовательский
 * сценарий без реальных платных вызовов RouterAI.
 */

import * as http from 'http';

const PORT = 3001;

/** Каждый вызов LLM увеличивает счётчик вопросов. */
let questionNumber = 0;

const QUESTIONS = [
  'Расскажите о вашем опыте работы с Python.',
  'Какие библиотеки для обработки данных вы используете?',
  'Расскажите о вашем последнем проекте.',
];

function buildReport() {
  return {
    overallScore: 8,
    strengths: ['Хорошее знание Python', 'Уверенно отвечает на вопросы'],
    weaknesses: ['Недостаточно опыта в командной работе'],
    developmentRecommendations: ['Углубляться в архитектуру распределённых систем'],
    hiringRecommendation: 'можно рассмотреть',
    recommendationReason: 'Кандидат показал стабильные знания и мотивацию.',
    insufficientData: false,
  };
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    const path = (req.url || '').split('?')[0];
    console.log(`[routerai-mock] ${req.method} ${path}`);

    try {
      if (req.method === 'GET' && path === '/models') {
        return json(res, 200, { data: ['gpt-4o'] });
      }

      if (req.method === 'POST' && path === '/__reset') {
        questionNumber = 0;
        return json(res, 200, { ok: true });
      }

      if (req.method === 'POST' && path === '/chat/completions') {
        // === LLM ===
        // Имитация финального ответа на 3-й вопрос
        const isFinal = questionNumber >= 2;
        if (isFinal) {
          return json(res, 200, {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    type: 'final',
                    recruiterMessage: 'Интервью завершено. Спасибо за ответы!',
                    shouldFinish: true,
                    report: buildReport(),
                  }),
                },
              },
            ],
          });
        }

        const question = QUESTIONS[questionNumber] || 'Расскажите о себе.';
        questionNumber++;
        return json(res, 200, {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: 'question',
                  questionNumber,
                  recruiterMessage: question,
                  answerAssessment: {
                    relevance: 7,
                    depth: 7,
                    clarity: 7,
                    summary: 'Ответ в целом корректный',
                  },
                  shouldFinish: false,
                }),
              },
            },
          ],
        });
      }

      if (req.method === 'POST' && path === '/audio/transcriptions') {
        // === STT ===
        return json(res, 200, { text: 'Mock транскрипция ответа кандидата' });
      }

      if (req.method === 'POST' && path === '/audio/speech') {
        // === TTS ===
        // Возвращаем минимальный валидный MP3-заголовок
        const fakeMp3 = Buffer.from([
          0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]);
        res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
        res.end(fakeMp3);
        return;
      }

      return json(res, 404, { error: `Not found: ${req.method} ${path}` });
    } catch (err) {
      console.error('[routerai-mock] error:', err);
      return json(res, 500, { error: 'mock server error' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[routerai-mock] listening on http://localhost:${PORT}`);
});

export default server;