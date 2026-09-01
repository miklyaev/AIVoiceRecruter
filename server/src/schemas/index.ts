import { z } from 'zod';

export { z };

export const SettingsUpdateSchema = z.object({
  apiKey: z.string().min(1, 'API-ключ обязателен'),
  baseUrl: z.string().url('Некорректный URL').default('https://routerai.ru/api/v1'),
});

export const PHONE_NUMBER_REGEX = /^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/;

export const CreateInterviewSchema = z.object({
  role: z.enum([
    'python-developer',
    'sales-manager',
    'hr-manager',
    'marketer',
    'analyst',
    'csharp-developer',
  ]),
  name: z.string().trim().min(1, 'Имя обязательно'),
  email: z.string().trim().email('Некорректный email'),
  phoneNumber: z.string().trim().regex(PHONE_NUMBER_REGEX, 'Формат телефона: +7-903-945-00-88'),
  experiance: z.string().trim().min(1, 'Опыт обязателен'),
});

export const TextAnswerSchema = z.object({
  text: z.string().trim().min(1, 'Текст ответа обязателен').max(5000, 'Ответ слишком длинный'),
});

export const AnswerAssessmentSchema = z.object({
  relevance: z.number().min(0).max(10),
  depth: z.number().min(0).max(10),
  clarity: z.number().min(0).max(10),
  summary: z.string(),
});

export const QuestionSchema = z.object({
  type: z.literal('question'),
  questionNumber: z.number().min(1).max(10),
  recruiterMessage: z.string(),
  answerAssessment: AnswerAssessmentSchema.optional(),
  shouldFinish: z.boolean(),
});

export const ReportSchema = z.object({
  overallScore: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  developmentRecommendations: z.array(z.string()),
  hiringRecommendation: z.enum(['рекомендуется к найму', 'можно рассмотреть', 'пока не рекомендуется']),
  recommendationReason: z.string(),
  insufficientData: z.boolean(),
});

export const FinalSchema = z.object({
  type: z.literal('final'),
  recruiterMessage: z.string(),
  shouldFinish: z.literal(true),
  report: ReportSchema,
});

export const LLMResponseSchema = z.union([QuestionSchema, FinalSchema]);