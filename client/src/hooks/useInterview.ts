import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppState, Message, Role, Report, SettingsStatus } from '../types';
import * as api from '../services/api';

interface UseInterviewReturn {
  state: AppState;
  statusMessage: string;
  roles: Role[];
  selectedRole: string;
  messages: Message[];
  report: Report | null;
  settingsStatus: SettingsStatus | null;
  interviewId: string | null;
  questionNumber: number;
  plannedQuestionCount: number;
  progress: number;
  error: string | null;
  setSelectedRole: (role: string) => void;
  startInterview: () => Promise<void>;
  sendAudioResponse: (blob: Blob) => Promise<void>;
  finishInterview: () => Promise<void>;
  restartInterview: () => void;
  generateSpeech: (messageId: string) => Promise<void>;
  checkSettings: () => Promise<void>;
  setSettingsStatus: (status: SettingsStatus) => void;
  setError: (error: string | null) => void;
}

export function useInterview(): UseInterviewReturn {
  const [state, setState] = useState<AppState>('INITIAL');
  const [statusMessage, setStatusMessage] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [plannedQuestionCount, setPlannedQuestionCount] = useState(7);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  // Load roles
  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => {});
  }, []);

  // Check settings on mount
  useEffect(() => {
    checkSettings();
  }, []);

  // Restore interview from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('interviewId');
    if (savedId) {
      api.getInterview(savedId)
        .then(data => {
          setInterviewId(data.id);
          setMessages(data.messages || []);
          setQuestionNumber(data.question_count || 0);
          setPlannedQuestionCount(data.planned_question_count || 7);
          if (data.final_report) {
            setReport(data.final_report);
            setState('COMPLETED');
          } else if (data.status === 'in_progress') {
            setState('ASKING');
          }
        })
        .catch(() => {
          localStorage.removeItem('interviewId');
        });
    }
  }, []);

  const checkSettings = useCallback(async () => {
    try {
      const status = await api.getSettingsStatus();
      setSettingsStatus(status);
      if (!status.configured) {
        setState('API_KEY_REQUIRED');
      } else if (state === 'INITIAL' || state === 'API_KEY_REQUIRED') {
        setState('READY');
      }
    } catch {
      setState('API_KEY_REQUIRED');
    }
  }, [state]);

  const startInterview = useCallback(async () => {
    if (!selectedRole || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setError(null);
    setState('STARTING');
    setStatusMessage('Начинаем собеседование...');
    setMessages([]);
    setReport(null);

    try {
      const result = await api.createInterview(selectedRole);
      setInterviewId(result.interviewId);
      localStorage.setItem('interviewId', result.interviewId);
      setQuestionNumber(result.questionNumber);
      setPlannedQuestionCount(result.plannedQuestionCount);
      setProgress((result.questionNumber / result.plannedQuestionCount) * 100);

      const greeting: Message = {
        id: 'greeting-' + Date.now(),
        role: 'assistant',
        text: `Здравствуйте! Я голосовой AI-рекрутер. Я проведу собеседование на позицию "${roles.find(r => r.id === selectedRole)?.title || selectedRole}", задам несколько вопросов и подготовлю итоговую оценку.`,
        messageType: 'greeting',
        createdAt: new Date().toISOString(),
      };

      setMessages([greeting, result.message]);
      setState('ASKING');
      setStatusMessage('');

      // Auto-play audio
      if (result.message.audioUrl) {
        playAudio(result.message.audioUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка начала собеседования');
      setState('ERROR');
    } finally {
      isProcessingRef.current = false;
    }
  }, [selectedRole, roles]);

  const sendAudioResponse = useCallback(async (blob: Blob) => {
    if (!interviewId || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setError(null);
    setState('TRANSCRIBING');
    setStatusMessage('Распознаём речь...');

    try {
      const result = await api.sendAnswer(interviewId, blob);

      setState('ANALYZING');
      setStatusMessage('Анализируем ответ...');

      // Update messages
      const newMessages = [...messages, result.candidateMessage];
      setMessages([...newMessages, result.recruiterMessage]);
      setQuestionNumber(result.questionNumber);
      setProgress((result.questionNumber / plannedQuestionCount) * 100);

      if (result.status === 'completed' && result.report) {
        setReport(result.report);
        setState('COMPLETED');
        setStatusMessage('');
        localStorage.removeItem('interviewId');
      } else {
        setState('ASKING');
        setStatusMessage('');

        // Auto-play audio
        if (result.recruiterMessage.audioUrl) {
          playAudio(result.recruiterMessage.audioUrl);
        }
      }
    } catch (err: any) {
      if (err.message.includes('распознать')) {
        setError(err.message);
        setState('ASKING');
      } else {
        setError(err.message || 'Ошибка обработки ответа');
        setState('ERROR');
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [interviewId, messages, plannedQuestionCount]);

  const finishInterviewFn = useCallback(async () => {
    if (!interviewId || isProcessingRef.current) return;

    if (!window.confirm('Вы уверены, что хотите завершить собеседование?')) return;

    isProcessingRef.current = true;
    setError(null);
    setState('ANALYZING');
    setStatusMessage('Формируем итоговый отчёт...');

    try {
      const result = await api.finishInterview(interviewId);
      if (result.report) {
        setReport(result.report);
      }
      setState('COMPLETED');
      setStatusMessage('');
      localStorage.removeItem('interviewId');
    } catch (err: any) {
      setError(err.message || 'Ошибка завершения собеседования');
      setState('ERROR');
    } finally {
      isProcessingRef.current = false;
    }
  }, [interviewId]);

  const restartInterview = useCallback(() => {
    setState('READY');
    setMessages([]);
    setReport(null);
    setInterviewId(null);
    setQuestionNumber(0);
    setProgress(0);
    setError(null);
    setStatusMessage('');
    setSelectedRole('');
    localStorage.removeItem('interviewId');
  }, []);

  const generateSpeech = useCallback(async (messageId: string) => {
    if (!interviewId) return;
    try {
      const result = await api.generateSpeech(interviewId, messageId);
      if (result.audioUrl) {
        playAudio(result.audioUrl);
      }
    } catch (err: any) {
      setError('Не удалось озвучить вопрос. Вы можете продолжить в текстовом режиме.');
    }
  }, [interviewId]);

  return {
    state, statusMessage, roles, selectedRole, messages, report,
    settingsStatus, interviewId, questionNumber, plannedQuestionCount, progress, error,
    setSelectedRole, startInterview, sendAudioResponse,
    finishInterview: finishInterviewFn, restartInterview, generateSpeech, checkSettings,
    setSettingsStatus, setError,
  };
}

function playAudio(url: string) {
  try {
    const audio = new Audio(url);
    audio.play().catch(() => {
      // Browser blocked autoplay - handled by component
    });
  } catch {
    // ignore
  }
}