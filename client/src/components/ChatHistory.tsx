import React, { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatHistoryProps {
  messages: Message[];
  onPlaySpeech: (messageId: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, onPlaySpeech }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin px-1" role="log" aria-label="История диалога">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onPlaySpeech={onPlaySpeech} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};