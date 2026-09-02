import React, { useState, useEffect } from 'react';
import type { SettingsStatus } from '../types';
import * as api from '../services/api';
import type { AppMode } from './InterviewControls';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingsStatus: SettingsStatus | null;
  onUpdate: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settingsStatus, onUpdate, mode, onModeChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://routerai.ru/api/v1');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearingAudio, setClearingAudio] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settingsStatus?.baseUrl) {
      setBaseUrl(settingsStatus.baseUrl);
    }
  }, [settingsStatus]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.saveSettings(apiKey, baseUrl);
      setMessage({ type: 'success', text: 'Настройки сохранены' });
      setApiKey('');
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const result = await api.testSettings();
      if (result.connected) {
        setMessage({ type: 'success', text: 'Подключение успешно' });
      } else {
        setMessage({ type: 'error', text: 'Не удалось подключиться' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка подключения' });
    } finally {
      setTesting(false);
    }
  };

  const handleClearAudio = async () => {
    if (!window.confirm('Удалить все mp3-файлы из папки с аудио?')) return;
    setClearingAudio(true);
    setMessage(null);
    try {
      const result = await api.clearAudio();
      setMessage({ type: 'success', text: `Аудифайлы удалены (${result.deleted} шт.)` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка очистки папки с аудио' });
    } finally {
      setClearingAudio(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить API-ключ?')) return;
    setSaving(true);
    try {
      await api.deleteSettings();
      setMessage({ type: 'success', text: 'API-ключ удалён' });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка удаления' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Настройки"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">⚙️ Настройки RouterAI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Закрыть настройки"
          >
            ✕
          </button>
        </div>

        {settingsStatus?.configured && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="text-gray-500">Текущий ключ: <span className="font-mono text-gray-700">{settingsStatus.maskedKey}</span></p>
            <p className="text-gray-500">Base URL: <span className="text-gray-700">{settingsStatus.baseUrl}</span></p>
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Режим работы приложения</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Режим работы приложения">
            <button
              type="button"
              onClick={() => onModeChange('work')}
              role="radio"
              aria-checked={mode === 'work'}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                mode === 'work' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              🎙️ Work — распознавание речи
            </button>
            <button
              type="button"
              onClick={() => onModeChange('debug')}
              role="radio"
              aria-checked={mode === 'debug'}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                mode === 'debug' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              🐛 Debug — текстовый ввод
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {mode === 'work'
              ? 'Ответы кандидата распознаются из речи (микрофон).'
              : 'Появляется поле ручного ввода текста ответа в обход распознавания речи — для интеграционного тестирования.'}
          </p>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Папка с аудио</p>
          <button
            type="button"
            onClick={handleClearAudio}
            disabled={clearingAudio}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
            aria-label="Очистить папку с аудио"
          >
            {clearingAudio ? 'Очистка...' : '🗑 Очистить папку с аудио'}
          </button>
          <p className="text-xs text-gray-500 mt-2">Удаляет все mp3-файлы озвучки из папки server/audio.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="settings-base-url" className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              id="settings-base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label htmlFor="settings-api-key" className="block text-sm font-medium text-gray-700 mb-1">
              API-ключ RouterAI
            </label>
            <input
              id="settings-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={settingsStatus?.configured ? 'Введите новый ключ для замены' : 'sk-...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        {message && (
          <div className={`mt-3 p-2 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || !apiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
            aria-label="Сохранить"
          >
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !settingsStatus?.configured}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm font-medium transition-colors"
            aria-label="Проверить подключение"
          >
            {testing ? 'Проверка...' : '🔌 Проверить подключение'}
          </button>
          {settingsStatus?.configured && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium transition-colors"
              aria-label="Удалить ключ"
            >
              🗑 Удалить ключ
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors ml-auto"
            aria-label="Закрыть"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};