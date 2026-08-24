import { describe, it, expect } from 'vitest';
import { ROLES, getRoleTitle } from '../src/types';

describe('Roles', () => {
  it('должен содержать 6 профессий', () => {
    expect(Object.keys(ROLES).length).toBe(6);
  });

  it('должен содержать python-developer', () => {
    expect(ROLES['python-developer']).toBeDefined();
    expect(ROLES['python-developer'].title).toBe('Python-разработчик');
  });

  it('должен содержать csharp-developer', () => {
    expect(ROLES['csharp-developer']).toBeDefined();
    expect(ROLES['csharp-developer'].title).toBe('C#-разработчик');
  });

  it('должен возвращать заголовок роли', () => {
    expect(getRoleTitle('python-developer')).toBe('Python-разработчик');
    expect(getRoleTitle('csharp-developer')).toBe('C#-разработчик');
    expect(getRoleTitle('unknown')).toBe('unknown');
  });
});