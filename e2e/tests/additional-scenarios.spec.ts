import { test, expect } from '@playwright/test';

/**
 * Дополнительные сценарии:
 *  - завершение интервью вручную (кнопка «Завершить собеседование»)
 *    с ручным подтверждением через диалог
 *  - проверка, что запись недоступна до старта интервью
 */

const ROUTES = {
  home: 'http://localhost:5173/',
};

test.describe('Дополнительные сценарии', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('http://localhost:3001/__reset');
  });

  test('Завершение интервью вручную формирует итоговый отчёт', async ({ page }) => {
    // Перехватываем window.confirm: отвечаем "Да"
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto(ROUTES.home);
    await expect(page.locator('#role-select')).toBeVisible();

    await page.locator('#role-select').selectOption('sales-manager');
    await page.getByRole('button', { name: /Начать собеседование/i }).click();

    // Дожидаемся первого вопроса (mock RouterAI)
    await expect(page.getByText(/Расскажите о вашем опыте работы с Python/i)).toBeVisible();

    // Кнопка завершения доступна в состоянии ASKING
    const finishBtn = page.getByRole('button', { name: /Завершить собеседование/i });
    await expect(finishBtn).toBeVisible();

    // Нажимаем завершить — подтверждаем диалог
    await finishBtn.click();

    // Появляется итоговый отчёт
    await expect(page.getByText(/📋 Итог собеседования/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/8\/10/)).toBeVisible();
  });

  test('Запись голоса недоступна до старта собеседования', async ({ page }) => {
    await page.goto(ROUTES.home);
    await expect(page.locator('#role-select')).toBeVisible();

    // Кнопок записи/ответа нет в начальном состоянии
    await expect(page.getByRole('button', { name: /Начать запись/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Ответить/i })).toHaveCount(0);
  });
});