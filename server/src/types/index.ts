import crypto from 'crypto';

export const ROLES = {
  'csharp-developer': {
    id: 'csharp-developer',
    title: 'C#-разработчик',
  },
  'cpp-developer': {
    id: 'cpp-developer',
    title: 'C++-разработчик',
  },
  'python-developer': {
    id: 'python-developer',
    title: 'Python-разработчик',
  },
  'analyst': {
    id: 'analyst',
    title: 'Аналитик',
  },
  'hr-manager': {
    id: 'hr-manager',
    title: 'HR-менеджер',
  },
  'sales-manager': {
    id: 'sales-manager',
    title: 'Менеджер по продажам',
  },
} as const;

export type RoleId = keyof typeof ROLES;

export function getRoleTitle(roleId: string): string {
  return ROLES[roleId as RoleId]?.title || roleId;
}

export function generateId(): string {
  return crypto.randomUUID();
}