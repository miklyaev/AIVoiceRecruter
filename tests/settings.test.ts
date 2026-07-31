import { describe, it, expect, vi } from 'vitest';
import { maskKey } from '../server/src/services/encryption';

describe('maskKey', () => {
  it('должен маскировать ключ', () => {
    const masked = maskKey('sk-very-long-api-key-abcdefgh');
    expect(masked).toContain('••••');
    expect(masked).not.toContain('sk-very');
  });

  it('не должен возвращать полный ключ', () => {
    const key = 'sk-test-key-1234';
    const masked = maskKey(key);
    expect(masked).not.toBe(key);
    expect(masked.length).toBeLessThan(key.length);
  });

  it('должен показывать последние 4 символа', () => {
    const key = 'sk-test-key-1234abcd';
    const masked = maskKey(key);
    expect(masked.endsWith('abcd')).toBe(true);
  });
});