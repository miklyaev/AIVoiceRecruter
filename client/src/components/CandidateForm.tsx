import React from 'react';
import type { CandidateFormData } from '../types';

const PHONE_REGEX = /^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CandidateFormProps {
  data: CandidateFormData;
  onChange: (data: CandidateFormData) => void;
  disabled: boolean;
}

export function validateCandidateForm(data: CandidateFormData): boolean {
  return (
    data.name.trim().length > 0 &&
    EMAIL_REGEX.test(data.email.trim()) &&
    PHONE_REGEX.test(data.phoneNumber.trim()) &&
    data.experiance.trim().length > 0
  );
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ data, onChange, disabled }) => {
  const nameValid = data.name.trim().length > 0;
  const emailValid = data.email.trim().length === 0 || EMAIL_REGEX.test(data.email.trim());
  const phoneValid = data.phoneNumber.trim().length === 0 || PHONE_REGEX.test(data.phoneNumber.trim());
  const experianceValid = data.experiance.trim().length > 0;

  const handleField = (field: keyof CandidateFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="space-y-1.5">
        <label htmlFor="candidate-name" className="block text-bg font-medium text-gray-700">
          ФИО
        </label>
        <input
          id="candidate-name"
          type="text"
          value={data.name}
          onChange={handleField('name')}
          disabled={disabled}
          placeholder="Иван Иванов"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          aria-label="Ваше имя"
          aria-invalid={!nameValid && data.name.length > 0}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="candidate-email" className="block text-bg font-medium text-gray-700">
          Email
        </label>
        <input
          id="candidate-email"
          type="email"
          value={data.email}
          onChange={handleField('email')}
          disabled={disabled}
          placeholder="ivan@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          aria-label="Email"
          aria-invalid={!emailValid}
        />
        {!emailValid && (
          <p className="text-xs text-red-600">Введите корректный email</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="candidate-phone" className="block text-bg font-medium text-gray-700">
          Номер телефона
        </label>
        <input
          id="candidate-phone"
          type="tel"
          value={data.phoneNumber}
          onChange={handleField('phoneNumber')}
          disabled={disabled}
          placeholder="+7-903-945-00-88"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          aria-label="Номер телефона"
          aria-invalid={!phoneValid}
        />
        {!phoneValid && (
          <p className="text-xs text-red-600">Формат: +7-903-945-00-88</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="candidate-experiance" className="block text-bg font-medium text-gray-700">
          Опыт работы
        </label>
        <input
          id="candidate-experiance"
          type="text"
          value={data.experiance}
          onChange={handleField('experiance')}
          disabled={disabled}
          placeholder="Например: 3 года"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
          aria-label="Опыт работы"
          aria-invalid={!experianceValid && data.experiance.length > 0}
        />
      </div>
    </div>
  );
};
