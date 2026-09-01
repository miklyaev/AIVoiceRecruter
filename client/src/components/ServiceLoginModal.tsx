import React, { useState } from 'react';
import * as api from '../services/api';

interface ServiceLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (login: string, password: string) => void;
}

export const ServiceLoginModal: React.FC<ServiceLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Проверка логина/пароля через существующий Basic Auth endpoint
      await api.getAdminCandidates(login, password);
      onSuccess(login, password);
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Служебный вход"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">🔐 Служебный вход</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
            aria-label="Закрыть окно входа"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="service-login" className="block text-sm font-medium text-gray-700 mb-1">
              Логин
            </label>
            <input
              id="service-login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="service-password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="service-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
              aria-label="Войти"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors ml-auto"
              aria-label="Отмена"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
