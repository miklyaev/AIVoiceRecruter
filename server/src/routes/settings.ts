import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db';
import { encrypt, decrypt, maskKey, EncryptedData } from '../services/encryption';
import { getConfig, testConnection } from '../services/routerai';
import { SettingsUpdateSchema } from '../schemas';

const router = Router();

// GET /api/settings/status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM settings WHERE id = 1');
    const settings = result.rows[0];

    if (!settings || !settings.encrypted_api_key) {
      return res.json({
        configured: false,
        maskedKey: null,
        baseUrl: 'https://routerai.ru/api/v1',
        connectionStatus: 'not_configured',
      });
    }

    const config = getConfig(
      { encrypted: settings.encrypted_api_key, iv: settings.encryption_iv, tag: settings.encryption_tag } as EncryptedData,
      settings.base_url
    );

    let connectionStatus = 'unknown';
    if (config) {
      const ok = await testConnection(config);
      connectionStatus = ok ? 'connected' : 'error';
    }

    const decrypted = decrypt({
      encrypted: settings.encrypted_api_key,
      iv: settings.encryption_iv,
      tag: settings.encryption_tag,
    });

    return res.json({
      configured: true,
      maskedKey: maskKey(decrypted),
      baseUrl: settings.base_url,
      connectionStatus,
    });
  } catch (err) {
    console.error('Settings status error:', err);
    return res.status(500).json({ error: 'Ошибка получения статуса настроек' });
  }
});

// PUT /api/settings/routerai
router.put('/routerai', async (req: Request, res: Response) => {
  try {
    const parsed = SettingsUpdateSchema.parse(req.body);
    const encrypted = encrypt(parsed.apiKey);

    const existing = await query('SELECT * FROM settings WHERE id = 1');

    if (existing.rows.length > 0) {
      await query(
        'UPDATE settings SET encrypted_api_key = $1, encryption_iv = $2, encryption_tag = $3, base_url = $4, updated_at = NOW() WHERE id = 1',
        [encrypted.encrypted, encrypted.iv, encrypted.tag, parsed.baseUrl]
      );
    } else {
      await query(
        'INSERT INTO settings (id, encrypted_api_key, encryption_iv, encryption_tag, base_url) VALUES (1, $1, $2, $3, $4)',
        [encrypted.encrypted, encrypted.iv, encrypted.tag, parsed.baseUrl]
      );
    }

    return res.json({
      configured: true,
      maskedKey: maskKey(parsed.apiKey),
      baseUrl: parsed.baseUrl,
      message: 'Настройки сохранены',
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Некорректные данные', details: err.errors });
    }
    console.error('Settings save error:', err);
    return res.status(500).json({ error: 'Ошибка сохранения настроек' });
  }
});

// DELETE /api/settings/routerai
router.delete('/routerai', async (req: Request, res: Response) => {
  try {
    await query(
      'UPDATE settings SET encrypted_api_key = $1, encryption_iv = $2, encryption_tag = $3, updated_at = NOW() WHERE id = 1',
      ['', '', '']
    );
    return res.json({ message: 'API-ключ удалён' });
  } catch (err) {
    console.error('Settings delete error:', err);
    return res.status(500).json({ error: 'Ошибка удаления ключа' });
  }
});

// POST /api/settings/audio/clear
router.post('/audio/clear', async (req: Request, res: Response) => {
  try {
    const audioDir = path.join(__dirname, '..', '..', 'audio');
    if (!fs.existsSync(audioDir)) {
      return res.json({ deleted: 0, message: 'Аудифайлы удалены' });
    }

    let deleted = 0;
    for (const file of fs.readdirSync(audioDir)) {
      if (file.endsWith('.mp3')) {
        fs.unlinkSync(path.join(audioDir, file));
        deleted++;
      }
    }

    return res.json({ deleted, message: 'Аудифайлы удалены' });
  } catch (err) {
    console.error('Audio clear error:', err);
    return res.status(500).json({ error: 'Ошибка очистки папки с аудио' });
  }
});

// POST /api/settings/test
router.post('/test', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM settings WHERE id = 1');
    const settings = result.rows[0];

    if (!settings || !settings.encrypted_api_key) {
      return res.status(400).json({ error: 'API-ключ не настроен', connected: false });
    }

    const config = getConfig(
      { encrypted: settings.encrypted_api_key, iv: settings.encryption_iv, tag: settings.encryption_tag } as EncryptedData,
      settings.base_url
    );

    if (!config) {
      return res.status(400).json({ error: 'Не удалось расшифровать API-ключ', connected: false });
    }

    const ok = await testConnection(config);
    if (ok) {
      return res.json({ connected: true, message: 'Подключение успешно' });
    } else {
      return res.status(400).json({ connected: false, error: 'Не удалось подключиться к RouterAI' });
    }
  } catch (err) {
    console.error('Settings test error:', err);
    return res.status(500).json({ error: 'Ошибка проверки подключения' });
  }
});

export default router;