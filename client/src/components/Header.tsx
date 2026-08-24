import React from 'react';
import type { SettingsStatus } from '../types';

interface HeaderProps {
  settingsStatus: SettingsStatus | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settingsStatus, onOpenSettings }) => {
  const getStatusLabel = () => {
    if (!settingsStatus) return { text: 'Проверка...', color: 'bg-gray-400' };
    switch (settingsStatus.connectionStatus) {
      case 'connected':
        return { text: 'API подключён', color: 'bg-green-500' };
      case 'error':
        return { text: 'Ошибка подключения', color: 'bg-red-500' };
      case 'not_configured':
        return { text: 'API-ключ не указан', color: 'bg-yellow-500' };
      default:
        return { text: 'Проверка...', color: 'bg-gray-400' };
    }
  };

  const status = getStatusLabel();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">
            🎙️ Голосовой AI-рекрутер
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 border border-gray-200">
            <span className={`w-2 h-2 rounded-full ${status.color}`} />
            <span className="text-gray-600">{status.text}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Служебная страница"
          >
            📋 Отчёты
          </a>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Открыть настройки"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>
    </header>
  );
};