import React from 'react';
import type { AdminCandidateItem, Role } from '../types';

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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="filter-role" className="block text-sm font-medium text-gray-700 mb-1">
            Должность
          </label>
          <select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все должности</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[220px]">
          <label htmlFor="filter-hiring" className="block text-sm font-medium text-gray-700 mb-1">
            Рекомендация
          </label>
          <select
            id="filter-hiring"
            value={hiringFilter}
            onChange={(e) => onHiringFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {HIRING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Должность</th>
              <th className="px-4 py-3 font-medium">Опыт</th>
              <th className="px-4 py-3 font-medium">Рекомендация</th>
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
            {!loading && candidates.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectCandidate(c)}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-600">{c.phoneNumber}</td>
                <td className="px-4 py-3 text-gray-600">{c.role}</td>
                <td className="px-4 py-3 text-gray-600">{c.experiance}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c.hiringRecommendation || (c.interviewCompleted ? '—' : 'Собеседование не завершено')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
