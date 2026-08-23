import { test, expect, Page } from '@playwright/test';

/**
 * E2E-тест основного пользовательского сценария:
 *   выбор профессии → старт интервью → голосовая запись ответа →
 *   отправка ответа → следующий вопрос → получение итогового отчёта.
 *
 * Внешний RouterAI заменён локальным mock-сервером (см. mock-server.ts),
 * поэтому сценарий детерминирован. Микрофон эмулируется Chromium
 * (--use-fake-device-for-media-stream), так что MediaRecorder реально
 * пишет webm-аудио.
 */

const ROUTES = {
  home: 'http://localhost:5173/',
};

test.describe('Голосовой AI-рекрутер — полный сценарий', () => {
  // Сбрасываем счётчик вопросов в mock-сервере перед каждым тестом,
  // чтобы сценарий всегда был детерминированным.
  test.beforeEach(async ({ request }) => {
    await request.post('http://localhost:3001/__reset');
  });

  test('Полный сценарий: выбор профессии → запись ответа → получение результата', async ({ page }) => {
    // === 1. Открыть главную страницу ===
    // Примечание: заголовок «Добро пожаловать» виден только в состоянии INITIAL,
    // которое существует мгновение до ответа GET /api/settings/status.
    // При настроенном API-ключе приложение сразу переходит в READY,
    // поэтому проверяем готовность через селектор профессии.
    await page.goto(ROUTES.home);

    // Приложение загружает роли и проверяет настройки API
    const roleSelect = page.locator('#role-select');
    await expect(roleSelect).toBeVisible();

    // === 2. Выбор профессии ===
    await roleSelect.selectOption('python-developer');
    await expect(roleSelect).toHaveValue('python-developer');

    // === 3. Старт собеседования ===
    await page.getByRole('button', { name: /Начать собеседование/i }).click();

    // Появляется первый вопрос (их генерирует mock RouterAI)
    await expect(page.getByText(/Расскажите о вашем опыте работы с Python/i)).toBeVisible();

    // Кнопки записи доступны
    const recordBtn = page.getByRole('button', { name: /Начать запись/i });
    await expect(recordBtn).toBeVisible();

    // === 4. Запись голосового ответа ===
    await recordBtn.click();

    // Индикатор записи появляется
    await expect(page.getByText(/Записываем ответ/i)).toBeVisible();

    // Эмулируем короткую запись (fake-микрофон пишет тишину)
    await page.waitForTimeout(1500);

    // Останавливаем запись
    await page.getByRole('button', { name: /Остановить запись/i }).click();

    // Появляется кнопка «Ответить»
    const answerBtn = page.getByRole('button', { name: /Ответить/i });
    await expect(answerBtn).toBeVisible();

    // === 5. Отправка ответа ===
    await answerBtn.click();

    // Идёт обработка (STT → LLM → TTS) — mock мгновенный,
    // поэтому статус может не успеть отрисоваться. Ключевая проверка —
    // появление следующего вопроса от рекрутера.
    await expect(page.getByText(/Какие библиотеки для обработки данных вы используете/i)).toBeVisible({ timeout: 30_000 });

    // Прогресс показывает "Вопрос 2 из 7"
    await expect(page.getByText(/Вопрос 2 из 7/i)).toBeVisible();

    // === 6. Повторная запись ответа (последний = финализация) ===
    await page.getByRole('button', { name: /Начать запись/i }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Остановить запись/i }).click();
    await page.getByRole('button', { name: /Ответить/i }).click();

    // === 7. Получение итогового отчёта ===
    await expect(page.getByText(/📋 Итог собеседования/i)).toBeVisible({ timeout: 30_000 });

    // Проверяем ключевые элементы отчётов
    await expect(page.getByText('8/10')).toBeVisible();
    await expect(page.getByText(/🤔 Можно рассмотреть/i)).toBeVisible();
    await expect(page.getByText(/✅ Сильные стороны/i)).toBeVisible();

    // Кнопка «Начать новое собеседование» доступна
    await expect(page.getByRole('button', { name: /Начать новое собеседование/i })).toBeVisible();
  });
});