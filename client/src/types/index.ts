export type AppState =
  | 'INITIAL'
  | 'API_KEY_REQUIRED'
  | 'READY'
  | 'STARTING'
  | 'ASKING'
  | 'RECORDING'
  | 'RECORDED'
  | 'TRANSCRIBING'
  | 'ANALYZING'
  | 'SYNTHESIZING'
  | 'PLAYING'
  | 'COMPLETED'
  | 'ERROR';

export interface Role {
  id: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  messageType: 'greeting' | 'question' | 'answer' | 'final' | 'system';
  questionNumber?: number;
  audioUrl?: string;
  createdAt: string;
  timestamp?: string;
}

export interface SettingsStatus {
  configured: boolean;
  maskedKey: string | null;
  baseUrl: string;
  connectionStatus: 'not_configured' | 'connected' | 'error' | 'unknown';
}

export interface CreateInterviewResponse {
  interviewId: string;
  status: string;
  questionNumber: number;
  plannedQuestionCount: number;
  message: Message;
}

export interface AnswerResponse {
  transcript: string;
  candidateMessage: Message;
  recruiterMessage: Message;
  questionNumber: number;
  status: string;
  report: Report | null;
}

export interface Report {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  developmentRecommendations: string[];
  hiringRecommendation: 'рекомендуется к найму' | 'можно рассмотреть' | 'пока не рекомендуется';
  recommendationReason: string;
  insufficientData: boolean;
}

export interface Interview {
  id: string;
  role: string;
  status: string;
  question_count: number;
  planned_question_count: number;
  final_report: Report | null;
  messages: Message[];
}