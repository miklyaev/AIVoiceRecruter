import React, { useState } from 'react';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onPlaySpeech: (messageId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlaySpeech }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isFinal = message.messageType === 'final';

  const handlePlay = () => {
    if (message.audioUrl) {
      setAudioPlaying(true);
      const audio = new Audio(message.audioUrl);
      audio.play().catch(() => {
        // Autoplay blocked
      });
      audio.onended = () => setAudioPlaying(false);
    } else {
      onPlaySpeech(message.id);
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center chat-message-enter">
        <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full max-w-xs text-center">
          {message.text}
        </div>
      </div>
    );
  }

  if (isFinal) {
    return (
      <div className="flex justify-center chat-message-enter">
        <div className="bg-purple-50 border border-purple-200 text-purple-900 text-sm px-4 py-3 rounded-lg max-w-md text-center">
          <p className="font-medium mb-1">📋 Итог собеседования</p>
          <p>{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} chat-message-enter`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-medium ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {isUser ? 'Вы' : 'AI-рекрутер'}
          </span>
          <span className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
            {new Date(message.createdAt || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        {!isUser && message.text && (
          <div className="mt-1.5 flex gap-1">
            {message.audioUrl && (
              <button
                onClick={handlePlay}
                disabled={audioPlaying}
                className="text-xs text-blue-500 hover:text-blue-700 focus:outline-none focus:underline disabled:opacity-50"
                aria-label="Прослушать ещё раз"
              >
                🔊 {audioPlaying ? 'Воспроизводится...' : 'Прослушать ещё раз'}
              </button>
            )}
            {!message.audioUrl && (
              <button
                onClick={handlePlay}
                className="text-xs text-blue-500 hover:text-blue-700 focus:outline-none focus:underline"
                aria-label="Воспроизвести вопрос"
              >
                🔊 Воспроизвести вопрос
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};