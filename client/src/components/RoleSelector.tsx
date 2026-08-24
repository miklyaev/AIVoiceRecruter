import React from 'react';
import type { Role } from '../types';

interface RoleSelectorProps {
  roles: Role[];
  selectedRole: string;
  onSelect: (role: string) => void;
  disabled: boolean;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ roles, selectedRole, onSelect, disabled }) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor="role-select" className="block text-bg font-medium text-gray-700">
        Выберите должность, на которую претендуете
      </label>
      <select
        id="role-select"
        value={selectedRole}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
        aria-label="Выберите должность"
      >
        <option value="">— Выберите должность —</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.title}
          </option>
        ))}
      </select>
    </div>
  );
};