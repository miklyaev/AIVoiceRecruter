import { describe, it, expect } from 'vitest';

describe('Prompt Content', () => {
  it('общий промпт содержит базовые правила', () => {
    const { COMMON_SYSTEM_PROMPT } = require('../server/src/prompts/common');
    expect(COMMON_SYSTEM_PROMPT).toContain('AI-рекрутер');
    expect(COMMON_SYSTEM_PROMPT).toContain('JSON');
    expect(COMMON_SYSTEM_PROMPT).toContain('защищённые характеристики');
  });

  it('buildSystemPrompt генерирует корректный системный промпт', () => {
    const { buildSystemPrompt } = require('../server/src/prompts/common');
    const prompt = buildSystemPrompt('Тестовый промпт', 3, 5, 10);
    expect(prompt).toContain('Тестовый промпт');
    expect(prompt).toContain('Вопрос №3');
  });

  it('каждый промпт профессии содержит название', () => {
    const { PYTHON_DEVELOPER_PROMPT } = require('../server/src/prompts/python-developer');
    expect(PYTHON_DEVELOPER_PROMPT).toContain('Python');

    const { SALES_MANAGER_PROMPT } = require('../server/src/prompts/sales-manager');
    expect(SALES_MANAGER_PROMPT).toContain('продажам');

    const { HR_MANAGER_PROMPT } = require('../server/src/prompts/hr-manager');
    expect(HR_MANAGER_PROMPT).toContain('HR');

    const { MARKETER_PROMPT } = require('../server/src/prompts/marketer');
    expect(MARKETER_PROMPT).toContain('Маркетолог');

    const { ANALYST_PROMPT } = require('../server/src/prompts/analyst');
    expect(ANALYST_PROMPT).toContain('Аналитика');
  });
});