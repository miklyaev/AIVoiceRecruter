import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMResponseSchema } from '../server/src/schemas';

describe('LLM Response Schema', () => {
  it('должен валидировать корректный ответ с вопросом', () => {
    const input = {
      type: 'question',
      questionNumber: 3,
      recruiterMessage: 'Расскажите о вашем опыте.',
      answerAssessment: {
        relevance: 8,
        depth: 7,
        clarity: 8,
        summary: 'Хороший ответ',
      },
      shouldFinish: false,
    };

    const result = LLMResponseSchema.parse(input);
    expect(result.type).toBe('question');
  });

  it('должен валидировать итоговый ответ', () => {
    const input = {
      type: 'final',
      recruiterMessage: 'Спасибо, собеседование завершено.',
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
    if (result.type === 'final') {
      expect(result.report.hiringRecommendation).toBe('можно рассмотреть');
    }
  });

  it('должен отклонять некорректную рекомендацию', () => {
    const input = {
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 8,
        strengths: [],
        weaknesses: [],
        developmentRecommendations: [],
        hiringRecommendation: 'invalid_value',
        recommendationReason: 'test',
        insufficientData: false,
      },
    };

    expect(() => LLMResponseSchema.parse(input)).toThrow();
  });

  it('должен отклонять оценку вне диапазона', () => {
    const input = {
      type: 'final',
      recruiterMessage: 'Спасибо.',
      shouldFinish: true,
      report: {
        overallScore: 15,
        strengths: [],
        weaknesses: [],
        developmentRecommendations: [],
        hiringRecommendation: 'можно рассмотреть',
        recommendationReason: 'test',
        insufficientData: false,
      },
    };

    expect(() => LLMResponseSchema.parse(input)).toThrow();
  });

  it('должен отклонять ответ с неверным типом', () => {
    const input = { type: 'unknown' };
    expect(() => LLMResponseSchema.parse(input)).toThrow();
  });
});