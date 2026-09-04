import React, { useState, useMemo } from 'react';
import type { AdminCandidateItem, Role } from '../types';

type SortKey = 'name' | 'role';
type SortDirection = 'asc' | 'desc';

const getRecommendationBadge = (candidate: AdminCandidateItem): { text: string; className: string } => {
  if (!candidate.interviewCompleted) {
    return { text: 'Не завершено', className: 'bg-gray-100 text-gray-500 border-gray-200' };
  }
  switch (candidate.hiringRecommendation) {
    case 'рекомендуется к найму':
      return { text: candidate.hiringRecommendation, className: 'bg-green-50 text-green-700 border-green-200' };
    case 'можно рассмотреть':
      return { text: candidate.hiringRecommendation, className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'пока не рекомендуется':
      return { text: candidate.hiringRecommendation, className: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { text: '—', className: 'bg-gray-50 text-gray-400 border-gray-200' };
  }
};

const HIRING_OPTIONS = [
  { value: '', label: 'Все рекомендации' },
  { value: 'рекомендуется к найму', label: 'Рекомендуется к найму' },
  { value: 'можно рассмотреть', label: 'Можно рассмотреть' },
  { value: 'пока не рекомендуется', label: 'Пока не рекомендуется' },
  { value: 'none', label: 'Не завершено / нет рекомендации' },
];

interface CandidatesTableProps {
  candidates: AdminCandidateItem[];
  roles: Role[];
  roleFilter: string;
  hiringFilter: string;
  onRoleFilterChange: (value: string) => void;
  onHiringFilterChange: (value: string) => void;
  onSelectCandidate: (candidate: AdminCandidateItem) => void;
  loading: boolean;
}

export const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates, roles, roleFilter, hiringFilter,
  onRoleFilterChange, onHiringFilterChange, onSelectCandidate, loading,
}) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedCandidates = useMemo(() => {
    if (!sortKey) return candidates;
    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...candidates].sort((a, b) =>
      a[sortKey].localeCompare(b[sortKey], 'ru') * factor
    );
  }, [candidates, sortKey, sortDirection]);

  const renderSortHeader = (key: SortKey, label: string) => {
    const isActive = sortKey === key;
    const arrow = isActive ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';
    return (
      <th
        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600"
        aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded ${isActive ? 'text-gray-900' : ''}`}
          aria-label={`Сортировать по полю ${label}`}
        >
          {label}
          <span aria-hidden="true">{arrow || ' ↕'}</span>
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="mt-[17px] inline-flex items-center gap-1.5 text-sm text-gray-500 italic">
          <span aria-hidden="true">👆</span>
          Для детального отчёта кликни по нужной строке
        </p>
        <div className="bg-gray-50 rounded-lg p-3 w-full sm:w-1/2">
          <p className="text-sm font-medium text-gray-700 mb-2">Фильтры</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px]">

              <select
                id="filter-role"
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                className="w-full px-3 py-[6px] text-sm text-gray-500 italic border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все должности</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.title}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">

              <select
                id="filter-hiring"
                value={hiringFilter}
                onChange={(e) => onHiringFilterChange(e.target.value)}
                className="w-full px-3 py-[6px] text-sm text-gray-500 italic border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {HIRING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left border-b-2 border-gray-300">
              {renderSortHeader('name', 'Имя')}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Телефон</th>
              {renderSortHeader('role', 'Должность')}
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Опыт</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Рекомендация</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Загрузка...</td>
              </tr>
            )}
            {!loading && candidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Кандидатов не найдено.</td>
              </tr>
            )}
            {!loading && sortedCandidates.map((c) => {
              const badge = getRecommendationBadge(c);
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCandidate(c)}
                  className="border-b border-gray-100 last:border-0 odd:bg-white even:bg-gray-50/60 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phoneNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{c.role}</td>
                  <td className="px-4 py-3 text-gray-600">{c.experiance}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${badge.className}`}>
                      {badge.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
