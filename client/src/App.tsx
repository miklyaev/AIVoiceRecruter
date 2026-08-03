import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useInterview } from './hooks/useInterview';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { Header } from './components/Header';
import { RoleSelector } from './components/RoleSelector';
import { InterviewControls } from './components/InterviewControls';
import { ChatHistory } from './components/ChatHistory';
import { FinalReport } from './components/FinalReport';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const {
    state, statusMessage, roles, selectedRole, messages, report,
    settingsStatus, interviewId, questionNumber, plannedQuestionCount, progress, error,
    setSelectedRole, startInterview, sendAudioResponse,
    finishInterview, restartInterview, generateSpeech, checkSettings,
    setSettingsStatus, setError, setState,
  } = useInterview();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const isRecordingRef = useRef(false);

  const audioRecorder = useAudioRecorder();

  const handleStartRecording = useCallback(async () => {
    setState('RECORDING');
    await audioRecorder.startRecording();
    isRecordingRef.current = true;
  }, [audioRecorder, setState]);

  const handleStopRecording = useCallback(() => {
    audioRecorder.stopRecording();
    setState('RECORDED');
    isRecordingRef.current = false;
  }, [audioRecorder, setState]);

  const handleAnswer = useCallback(() => {
    if (audioRecorder.audioBlob) {
      sendAudioResponse(audioRecorder.audioBlob);
      audioRecorder.clear();
    } else if (pendingBlob) {
      sendAudioResponse(pendingBlob);
      setPendingBlob(null);
    }
  }, [audioRecorder, pendingBlob, sendAudioResponse]);

  // When recording completes, store blob
  useEffect(() => {
    if (audioRecorder.audioBlob && !audioRecorder.isRecording) {
      setPendingBlob(audioRecorder.audioBlob);
    }
  }, [audioRecorder.audioBlob, audioRecorder.isRecording]);

  const handleFinish = useCallback(() => {
    finishInterview();
  }, [finishInterview]);

  const handleRestart = useCallback(() => {
    audioRecorder.clear();
    setPendingBlob(null);
    restartInterview();
  }, [audioRecorder, restartInterview]);

  // Show settings modal when API key is required
  useEffect(() => {
    if (state === 'API_KEY_REQUIRED' && !settingsOpen) {
      // Don't auto-open, just show the state
    }
  }, [state]);

  const isProcessing = ['TRANSCRIBING', 'ANALYZING', 'SYNTHESIZING', 'STARTING'].includes(state);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <Header
        settingsStatus={settingsStatus}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Welcome / Status */}
        {state === 'INITIAL' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎙️</div>
            <h2 className="text-xl font-semibold mb-2">Добро пожаловать в AI-рекрутер</h2>
            <p className="text-gray-600">
              Выберите должность и начните голосовое собеседование с AI-рекрутером.
            </p>
          </div>
        )}

        {state === 'API_KEY_REQUIRED' && (
          <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-lg font-semibold mb-2">API-ключ не указан</h2>
            <p className="text-gray-600 mb-4">
              Для работы приложения необходимо указать API-ключ RouterAI.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Открыть настройки"
            >
              ⚙️ Открыть настройки
            </button>
          </div>
        )}

        {/* Role Selection */}
        {(state === 'READY' || state === 'STARTING') && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <RoleSelector
              roles={roles}
              selectedRole={selectedRole}
              onSelect={setSelectedRole}
              disabled={state === 'STARTING'}
            />
          </div>
        )}

        {/* Progress Bar */}
        {(state === 'ASKING' || state === 'RECORDING' || state === 'RECORDED' || state === 'TRANSCRIBING' || state === 'ANALYZING' || state === 'SYNTHESIZING') && plannedQuestionCount > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Вопрос {questionNumber} из {plannedQuestionCount}
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        {messages.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <ChatHistory messages={messages} onPlaySpeech={generateSpeech} />
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full pulse" />
              {statusMessage}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 text-sm mb-2">{error}</p>
            {state === 'ERROR' && (
              <button
                onClick={() => setError(null)}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Попробовать снова
              </button>
            )}
          </div>
        )}

        {/* Recording Indicator */}
        {audioRecorder.isRecording && (
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="w-3 h-3 bg-red-500 rounded-full pulse" />
            <span className="text-sm font-medium text-red-600">
              Записываем ответ... {Math.floor(audioRecorder.duration / 60)}:{(audioRecorder.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {audioRecorder.error && (
          <div className="text-center">
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{audioRecorder.error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <InterviewControls
            state={state}
            selectedRole={selectedRole}
            isRecording={audioRecorder.isRecording}
            onStart={startInterview}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onAnswer={handleAnswer}
            onFinish={handleFinish}
            onRestart={handleRestart}
          />
        </div>

        {/* Final Report */}
        {report && <FinalReport report={report} />}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">
        Голосовой AI-рекрутер &copy; 2026
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settingsStatus={settingsStatus}
        onUpdate={checkSettings}
      />
    </div>
  );
};

export default App;