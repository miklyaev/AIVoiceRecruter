import React, { useEffect, useRef, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AudioRecorderProps {
  isActive: boolean;
  onRecordingComplete: (blob: Blob) => void;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  error: string | null;
  disabled: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isActive, onRecordingComplete, onRecordingStart, onRecordingStop, error, disabled,
}) => {
  const { isRecording, duration, audioBlob, startRecording, stopRecording, error: recorderError, clear } = useAudioRecorder();
  const [hasRecording, setHasRecording] = useState(false);
  const prevIsRecording = useRef(false);

  useEffect(() => {
    if (isActive && !isRecording && !hasRecording && !prevIsRecording.current) {
      startRecording();
      onRecordingStart();
    }
    prevIsRecording.current = isRecording;
  }, [isActive]);

  useEffect(() => {
    if (audioBlob && !isRecording) {
      setHasRecording(true);
      onRecordingComplete(audioBlob);
      clear();
    }
  }, [audioBlob, isRecording]);

  const handleStop = () => {
    stopRecording();
    onRecordingStop();
  };

  const displayError = error || recorderError;

  return (
    <div className="space-y-2">
      {isRecording && (
        <div className="flex items-center justify-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full pulse" />
          <span className="text-sm font-medium text-red-600">
            Запись... {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </span>
          <button
            onClick={handleStop}
            disabled={disabled}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            aria-label="Остановить запись"
          >
            ⏹ Стоп
          </button>
        </div>
      )}
      {displayError && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-2">{displayError}</p>
      )}
    </div>
  );
};