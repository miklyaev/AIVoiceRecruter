import { defineConfig, devices } from '@playwright/test';

/**
 * E2E конфигурация для Голосового AI-рекрутера.
 *
 * Сервисы, поднимаемые Playwright:
 *  1. mock RouterAI (e2e/mock-server.ts) на http://localhost:3001
 *  2. Backend (Express) — реальный, с локальной PostgreSQL,
 *     но с ROUTERAI_BASE_URL=http://localhost:3001 (подмена внешнего AI)
 *  3. Frontend (Vite dev server) на http://localhost:5173
 *
 * Микрофон эмулируется через launch-флаги Chromium (fake media stream),
 * поэтому запись голоса в тесте использует настоящий MediaRecorder,
 * который пишет реальный webm-файл.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    launchOptions: {
      // Эмуляция микрофона + автоматическое разрешение на доступ
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--use-file-for-fake-audio-capture=',
        '--autoplay-policy=no-user-gesture-required',
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Сервисы (mock RouterAI на :3001, backend на :3000, frontend на :5173)
  // запускаются вручную или отдельным скриптом e2e/start-e2e.ps1,
  // т.к. webServer Playwright на Windows требователен к окружению.
  webServer: [],
});