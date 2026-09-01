import React, { useState, useCallback, useEffect } from 'react';
import type { AdminCandidateItem, AdminCandidateDetail, Role } from '../types';
import * as api from '../services/api';
import { FinalReport } from './FinalReport';
import { CandidatesTable } from './CandidatesTable';

export const AdminPage: React.FC = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<AdminCandidateItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [hiringFilter, setHiringFilter] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<AdminCandidateDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => {});
  }, []);

  // Автовход, если служебный вход уже выполнен на главной странице
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('serviceAuth');
      if (saved) {
        const auth = JSON.parse(saved);
        setLogin(auth.login);
        setPassword(auth.password);
        api.getAdminCandidates(auth.login, auth.password)
          .then((result) => {
            setCandidates(result.candidates);
            setAuthorized(true);
          })
          .catch(() => {
            sessionStorage.removeItem('serviceAuth');
          });
      }
    } catch {
      // ignore
    }
  }, []);

  const loadCandidates = useCallback(async (currentLogin: string, currentPassword: string) => {
    setLoading(true);
    try {
      const result = await api.getAdminCandidates(currentLogin, currentPassword, {
        role: roleFilter || undefined,
        hiringRecommendation: hiringFilter || undefined,
      });
      setCandidates(result.candidates);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки кандидатов');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, hiringFilter]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.getAdminCandidates(login, password);
      setCandidates(result.candidates);
      setAuthorized(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  }, [login, password]);

  useEffect(() => {
    if (authorized) {
      loadCandidates(login, password);
    }
  }, [authorized, roleFilter, hiringFilter]);

  const handleSelectCandidate = useCallback(async (candidate: AdminCandidateItem) => {
    setDetailError(null);
    setDetailLoading(true);
    setSelectedCandidate(null);
    try {
      const detail = await api.getAdminCandidateDetail(login, password, candidate.id);
      setSelectedCandidate(detail);
    } catch (err: any) {
      setDetailError(err.message || 'Ошибка загрузки данных кандидата');
    } finally {
      setDetailLoading(false);
    }
  }, [login, password]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm w-full max-w-sm space-y-4"
        >
          <h1 className="text-lg font-semibold text-center">🔒 Служебная страница</h1>
          <div>
            <label htmlFor="admin-login" className="block text-sm font-medium text-gray-700 mb-1">
              Логин
            </label>
            <input
              id="admin-login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
          <a href="/" className="block text-center text-sm text-blue-600 hover:underline">
            ← Вернуться на главную
          </a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">📋 Кандидаты</h1>
          <a href="/" className="text-sm text-blue-600 hover:underline">
            ← На главную
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {error && <p className="text-center text-red-600 text-sm">{error}</p>}

        <CandidatesTable
          candidates={candidates}
          roles={roles}
          roleFilter={roleFilter}
          hiringFilter={hiringFilter}
          onRoleFilterChange={setRoleFilter}
          onHiringFilterChange={setHiringFilter}
          onSelectCandidate={handleSelectCandidate}
          loading={loading}
        />

        {detailLoading && (
          <p className="text-center text-gray-500">Загрузка отчёта...</p>
        )}

        {detailError && (
          <p className="text-center text-red-600 text-sm">{detailError}</p>
        )}

        {selectedCandidate && !detailLoading && (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 flex flex-wrap gap-2 justify-between">
              <span>Кандидат: <span className="font-medium text-gray-700">{selectedCandidate.name}</span></span>
              <span>Должность: <span className="font-medium text-gray-700">{selectedCandidate.role}</span></span>
            </div>
            {selectedCandidate.interviewCompleted && selectedCandidate.report ? (
              <FinalReport report={selectedCandidate.report} />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center text-yellow-800 text-sm">
                Собеседование ещё не завершено, отчёт недоступен.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
