import { describe, it, expect } from 'vitest';
import { ROLES, getRoleTitle } from '../src/types';

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
});