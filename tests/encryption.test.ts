import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../services/encryption';

// Mock environment
vi.stubEnv('APP_ENCRYPTION_KEY', 'test-key-1234567890123456');

describe('ecryption', () => {
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
});