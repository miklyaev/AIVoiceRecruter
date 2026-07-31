import { describe, it, expect, vi } from 'vitest';
import { encrypt, decrypt, maskKey } from '../src/services/encryption';

vi.stubEnv('APP_ENCRYPTION_KEY', 'test-key-1234567890123456');

describe('encryption', () => {
  it('должен корректно шифровать и расшифровывать', () => {
    const original = 'sk-routerai-test-key-12345';
    const encrypted = encrypt(original);
    
    expect(encrypted.encrypted).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.tag).toBeTruthy();
    expect(encrypted.encrypted).not.toBe(original);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('API-ключ сохраняется в зашифрованном виде', () => {
    const original = 'sk-secret-key-abcdef';
    const encrypted = encrypt(original);
    expect(encrypted.encrypted).not.toContain('sk-');
    expect(encrypted.encrypted).not.toContain('secret');
  });

  it('полный API-ключ не возвращается клиенту (maskKey)', () => {
    const key = 'sk-test-key-1234abcd';
    const masked = maskKey(key);
    expect(masked).not.toBe(key);
    expect(masked).toContain('••••');
    expect(masked.endsWith('abcd')).toBe(true);
  });
});