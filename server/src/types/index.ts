import crypto from 'crypto';

export const ROLES = {
  'python-developer': {
    id: 'python-developer',
    title: 'Python-разработчик',
  },
  'sales-manager': {
    id: 'sales-manager',
    title: 'Менеджер по продажам',
  },
  'hr-manager': {
    id: 'hr-manager',
    title: 'HR-менеджер',
  },
  'marketer': {
    id: 'marketer',
    title: 'Маркетолог',
  },
  'analyst': {
    id: 'analyst',
    title: 'Аналитик',
  },
} as const;

export type RoleId = keyof typeof ROLES;

export function getRoleTitle(roleId: string): string {
  return ROLES[roleId as RoleId]?.title || roleId;
}

export function generateId(): string {
  return crypto.randomUUID();
}