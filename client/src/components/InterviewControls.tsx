import React, { useState } from 'react';
import type { AppState } from '../types';

export type AppMode = 'work' | 'debug';

interface InterviewControlsProps {
  state: AppState;
  selectedRole: string;
  candidateValid: boolean;
  isRecording: boolean;
  mode: AppMode;
  onStart: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnswer: () => void;
  onTextAnswer: (text: string) => void;
  onFinish: () => void;
  onRestart: () => void;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  state, selectedRole, candidateValid, isRecording, mode,
  onStart, onStartRecording, onStopRecording, onAnswer, onTextAnswer, onFinish, onRestart,
}) => {
  const [debugAnswer, setDebugAnswer] = useState('');

  const canStart = selectedRole && candidateValid && (state === 'READY' || state === 'API_KEY_REQUIRED');
  const canRecord = state === 'ASKING' && !isRecording && mode === 'work';
  const canStop = isRecording;
  const canAnswer = (state === 'RECORDING' || state === 'RECORDED') && !isRecording;
  const canFinish = state === 'ASKING' && !isRecording;
  const showRestart = state === 'COMPLETED' || state === 'ERROR';
  const isDebug = mode === 'debug';

  const showStartHint = selectedRole && (state === 'READY' || state === 'API_KEY_REQUIRED' || state === 'STARTING');

  const submitDebugAnswer = () => {
    const text = debugAnswer.trim();
    if (!text) return;
    setDebugAnswer('');
    onTextAnswer(text);
  };

  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitDebugAnswer();
  };

  const handleDebugKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitDebugAnswer();
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      {(showStartHint || showRestart) && (
        <div className="w-full max-w-md border-2 border-red-500 bg-red-50 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-2xl" aria-hidden="true">⚠️</span>
          <p className="text-sm text-red-700 text-left font-medium">
            Для корректного распознавания ответа, отвечать нужно чётко и внятно. Английские слова необходимо произносить в правильной транскрипции. Большие паузы в речи делать не рекомендуется.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {showStartHint && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Начать собеседование"
          >
            ▶ Начать собеседование
          </button>
        )}

        {canRecord && (
          <button
            onClick={onStartRecording}
            className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            aria-label="Начать запись"
          >
            🔴 Начать запись
          </button>
        )}

        {isDebug && state === 'ASKING' && (
          <form onSubmit={handleDebugSubmit} className="w-full pl-5 flex gap-2 items-end">
            <label htmlFor="debug-answer" className="sr-only">
              Текст ответа кандидата
            </label>
            <textarea
              id="debug-answer"
              rows={3}
              value={debugAnswer}
              onChange={(e) => setDebugAnswer(e.target.value)}
              onKeyDown={handleDebugKeyDown}
              placeholder="Ответ кандидата (без распознавания речи)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!debugAnswer.trim()}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              aria-label="Отправить текстовый ответ"
            >
              📤 Ответить
            </button>
          </form>
        )}

        {canStop && (
          <button
            onClick={onStopRecording}
            className="px-5 py-2.5 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
            aria-label="Остановить запись"
          >
            ⏹ Остановить запись
          </button>
        )}

        {canAnswer && (
          <button
            onClick={onAnswer}
            className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            aria-label="Ответить"
          >
            📤 Отправить ответ
          </button>
        )}

        {canFinish && (
          <button
            onClick={onFinish}
            className="px-5 py-2.5 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            aria-label="Завершить собеседование"
          >
            ⏹ Завершить собеседование
          </button>
        )}

        {showRestart && (
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            aria-label="Начать новое собеседование"
          >
            🔄 Начать новое собеседование
          </button>
        )}
      </div>
    </div>
  );
};