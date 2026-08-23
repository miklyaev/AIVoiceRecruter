import { decrypt, EncryptedData } from './encryption';

interface RouterAIConfig {
  apiKey: string;
  baseUrl: string;
}

export function getConfig(encryptedKey: EncryptedData | null, baseUrl: string): RouterAIConfig | null {
  if (!encryptedKey || !encryptedKey.encrypted) return null;
  try {
    const apiKey = decrypt(encryptedKey);
    // Приоритет: env-переменная (позволяет E2E подменять внешний API на mock-сервер),
    // затем значение из БД, затем дефолт RouterAI.
    const resolvedBaseUrl = process.env.ROUTERAI_BASE_URL || baseUrl || 'https://routerai.ru/api/v1';
    return { apiKey, baseUrl: resolvedBaseUrl };
  } catch {
    return null;
  }
}

export async function testConnection(config: RouterAIConfig): Promise<boolean> {
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function chatCompletions(
  config: RouterAIConfig,
  model: string,
  messages: { role: string; content: string }[],
  options?: { response_format?: { type: string } }
): Promise<string> {
  const body: any = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };

  if (options?.response_format) {
    body.response_format = options.response_format;
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RouterAI LLM error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

export async function audioTranscriptions(
  config: RouterAIConfig,
  model: string,
  audioBuffer: Buffer,
  mimeType: string,
  filename: string = 'audio.webm'
): Promise<string> {
  const formData = new FormData();

  // Determine file extension from mime type
  const ext = mimeType.includes('webm') ? 'webm' :
              mimeType.includes('ogg') ? 'ogg' :
              mimeType.includes('wav') ? 'wav' :
              mimeType.includes('mp3') ? 'mp3' : 'webm';

  const blob = new Blob([audioBuffer], { type: mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', model);
  formData.append('language', 'ru');

  const response = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RouterAI STT error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  return data.text || '';
}

export async function audioSpeech(
  config: RouterAIConfig,
  model: string,
  text: string,
  voice: string = 'ru-RU-Masha:MAI-Voice-2-Flash'
): Promise<Buffer> {
  const response = await fetch(`${config.baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RouterAI TTS error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}