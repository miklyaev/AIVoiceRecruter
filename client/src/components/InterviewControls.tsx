import React from 'react';
import type { AppState } from '../types';

interface InterviewControlsProps {
  state: AppState;
  selectedRole: string;
  candidateValid: boolean;
  isRecording: boolean;
  onStart: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnswer: () => void;
  onFinish: () => void;
  onRestart: () => void;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  state, selectedRole, candidateValid, isRecording,
  onStart, onStartRecording, onStopRecording, onAnswer, onFinish, onRestart,
}) => {
  const canStart = selectedRole && candidateValid && (state === 'READY' || state === 'API_KEY_REQUIRED');
  const canRecord = state === 'ASKING' && !isRecording;
  const canStop = isRecording;
  const canAnswer = (state === 'RECORDING' || state === 'RECORDED') && !isRecording;
  const canFinish = state === 'ASKING' && !isRecording;
  const showRestart = state === 'COMPLETED' || state === 'ERROR';

  const showStartHint = selectedRole && (state === 'READY' || state === 'API_KEY_REQUIRED' || state === 'STARTING');

  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      {(showStartHint || showRestart) && (
        <p className="text-sm text-red-600 text-center max-w-md">
          Отвечать нужно чётко, внятно и громко, чтобы было корректное распознавание ответа. Большие паузы в речи делать не рекомендуется.
        </p>
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