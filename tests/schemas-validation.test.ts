import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateInterviewSchema, SettingsUpdateSchema } from '../server/src/schemas';

describe('Interview Schema', () => {
  it('должен валидировать корректную роль', () => {
    const result = CreateInterviewSchema.parse({ role: 'python-developer' });
    expect(result.role).toBe('python-developer');
  });

  it('должен отклонять некорректную роль', () => {
    expect(() => CreateInterviewSchema.parse({ role: 'invalid' })).toThrow();
  });

  it('без выбора профессии интервью не начинается (нет роли)', () => {
    expect(() => CreateInterviewSchema.parse({})).toThrow();
  });
});

describe('Settings Schema', () => {
  it('должен валидировать корректные настройки', () => {
    const result = SettingsUpdateSchema.parse({
      apiKey: 'sk-test-key',
      baseUrl: 'https://routerai.ru/api/v1',
    });
    expect(result.apiKey).toBe('sk-test-key');
  });

  it('должен устанавливать URL по умолчанию', () => {
    const result = SettingsUpdateSchema.parse({ apiKey: 'sk-test' });
    expect(result.baseUrl).toBe('https://routerai.ru/api/v1');
  });

  it('должен отклонять пустой ключ', () => {
    expect(() => SettingsUpdateSchema.parse({ apiKey: '' })).toThrow();
  });
});