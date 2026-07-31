import { describe, it, expect } from 'vitest';
import { ROLES, getRoleTitle } from '../server/src/types';

describe('Roles', () => {
  it('должен содержать 5 профессий', () => {
    expect(Object.keys(ROLES).length).toBe(5);
  });

  it('должен содержать python-developer', () => {
    expect(ROLES['python-developer']).toBeDefined();
    expect(ROLES['python-developer'].title).toBe('Python-разработчик');
  });

  it('должен возвращать заголовок роли', () => {
    expect(getRoleTitle('python-developer')).toBe('Python-разработчик');
    expect(getRoleTitle('unknown')).toBe('unknown');
  });

  it('для каждой профессии используется свой системный промпт', () => {
    const prompts = {
      'python-developer': '../server/src/prompts/python-developer',
      'sales-manager': '../server/src/prompts/sales-manager',
      'hr-manager': '../server/src/prompts/hr-manager',
      'marketer': '../server/src/prompts/marketer',
      'analyst': '../server/src/prompts/analyst',
    };

    Object.entries(prompts).forEach(([role, path]) => {
      const mod = require(path);
      expect(mod).toBeDefined();
      const key = Object.keys(mod)[0];
      expect(mod[key]).toContain('собеседование');
    });
  });
});