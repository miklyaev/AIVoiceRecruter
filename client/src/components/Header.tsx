import React from 'react';
import type { AppMode } from './InterviewControls';
import type { SettingsStatus } from '../types';

interface HeaderProps {
  settingsStatus: SettingsStatus | null;
  appMode: AppMode;
  serviceAuthorized: boolean;
  onServiceLogin: () => void;
  onServiceLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ settingsStatus, appMode, serviceAuthorized, onServiceLogin, onServiceLogout, onOpenSettings }) => {
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
          {appMode === 'debug' && (
            <span
              className="px-2 py-1 -ml-[3px] rounded-full text-xs font-bold text-red-600 bg-red-50 border border-red-300"
              aria-label="Активен режим отладки"
            >
              DEBUG
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {serviceAuthorized ? (
            <>
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
              <button
                onClick={onServiceLogout}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Выйти из служебного режима"
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              onClick={onServiceLogin}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Служебный вход"
            >
              🔐 Служебный вход
            </button>
          )}
        </div>
      </div>
    </header>
  );
};