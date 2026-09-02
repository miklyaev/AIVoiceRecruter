import { describe, it, expect } from 'vitest';
import { LLMResponseSchema, CreateInterviewSchema, SettingsUpdateSchema } from '../src/schemas';

describe('LLM Response Schema', () => {
  it('должен валидировать корректный ответ с вопросом', () => {
    const input = {
      type: 'question',
      questionNumber: 3,
      recruiterMessage: 'Расскажите о вашем опыте.',
      answerAssessment: { relevance: 8, depth: 7, clarity: 8, summary: 'Хороший ответ' },
      shouldFinish: false,
    };
    const result = LLMResponseSchema.parse(input);
    expect(result.type).toBe('question');
  });

  it('должен валидировать итоговый ответ', () => {
    const input = {
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 8,
        strengths: ['Хорошее понимание'],
        weaknesses: ['Недостаточно опыта'],
        developmentRecommendations: ['Изучить профилирование'],
        hiringRecommendation: 'можно рассмотреть',
        recommendationReason: 'Хорошая база',
        insufficientData: false,
      },
    };
    const result = LLMResponseSchema.parse(input);
    expect(result.type).toBe('final');
  });

  it('должен отклонять некорректную рекомендацию', () => {
    expect(() => LLMResponseSchema.parse({
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 8,
        strengths: [], weaknesses: [],
        developmentRecommendations: [],
        hiringRecommendation: 'invalid_value',
        recommendationReason: 'test',
        insufficientData: false,
      },
    })).toThrow();
  });

  it('должен валидировать отчёт с нулевой оценкой при недостатке данных', () => {
    const result = LLMResponseSchema.parse({
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 0,
        strengths: [],
        weaknesses: ['Интервью завершено до проверки ключевых компетенций'],
        developmentRecommendations: [],
        hiringRecommendation: 'пока не рекомендуется',
        recommendationReason: 'Данных недостаточно для оценки',
        insufficientData: true,
      },
    });
    expect(result.type).toBe('final');
    expect((result as any).report.overallScore).toBe(0);
  });

  it('должен отклонять отрицательную оценку', () => {
    expect(() => LLMResponseSchema.parse({
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: -1,
        strengths: [], weaknesses: [],
        developmentRecommendations: [],
        hiringRecommendation: 'можно рассмотреть',
        recommendationReason: 'test',
        insufficientData: false,
      },
    })).toThrow();
  });

  it('должен отклонять оценку вне диапазона', () => {
    expect(() => LLMResponseSchema.parse({
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 15,
        strengths: [], weaknesses: [],
        developmentRecommendations: [],
        hiringRecommendation: 'можно рассмотреть',
        recommendationReason: 'test',
        insufficientData: false,
      },
    })).toThrow();
  });
});

describe('CreateInterviewSchema', () => {
  const validCandidate = {
    role: 'python-developer',
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phoneNumber: '+7-903-945-00-88',
    experiance: '3 года',
  };

  it('должен валидировать корректную роль и данные кандидата', () => {
    const result = CreateInterviewSchema.parse(validCandidate);
    expect(result.role).toBe('python-developer');
  });

  it('должен отклонять некорректную роль', () => {
    expect(() => CreateInterviewSchema.parse({ ...validCandidate, role: 'invalid' })).toThrow();
  });

  it('без выбора профессии интервью не начинается', () => {
    expect(() => CreateInterviewSchema.parse({})).toThrow();
  });

  it('должен отклонять некорректный формат телефона', () => {
    expect(() => CreateInterviewSchema.parse({ ...validCandidate, phoneNumber: '89039450088' })).toThrow();
  });

  it('должен отклонять некорректный email', () => {
    expect(() => CreateInterviewSchema.parse({ ...validCandidate, email: 'not-an-email' })).toThrow();
  });
});

describe('SettingsUpdateSchema', () => {
  it('должен валидировать корректные настройки', () => {
    const result = SettingsUpdateSchema.parse({ apiKey: 'sk-test-key', baseUrl: 'https://routerai.ru/api/v1' });
    expect(result.apiKey).toBe('sk-test-key');
  });

  it('должен устанавливать URL по умолчанию', () => {
    const result = SettingsUpdateSchema.parse({ apiKey: 'sk-test' });
    expect(result.baseUrl).toBe('https://routerai.ru/api/v1');
  });

  it('должен отклонять пустой ключ', () => {
    expect(() => SettingsUpdateSchema.parse({ apiKey: '' })).toThrow();
  });
});