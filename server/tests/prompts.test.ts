import { describe, it, expect } from 'vitest';
import { COMMON_SYSTEM_PROMPT, buildSystemPrompt } from '../src/prompts/common';
import { PYTHON_DEVELOPER_PROMPT } from '../src/prompts/python-developer';
import { SALES_MANAGER_PROMPT } from '../src/prompts/sales-manager';
import { HR_MANAGER_PROMPT } from '../src/prompts/hr-manager';
import { MARKETER_PROMPT } from '../src/prompts/marketer';
import { ANALYST_PROMPT } from '../src/prompts/analyst';

describe('Prompts', () => {
  it('общий промпт содержит базовые правила', () => {
    expect(COMMON_SYSTEM_PROMPT).toContain('AI-рекрутер');
    expect(COMMON_SYSTEM_PROMPT).toContain('JSON');
    expect(COMMON_SYSTEM_PROMPT).toContain('защищённые характеристики');
  });

  it('buildSystemPrompt генерирует корректный системный промпт', () => {
    const prompt = buildSystemPrompt('Тестовый промпт', 3, 5, 10);
    expect(prompt).toContain('Тестовый промпт');
    expect(prompt).toContain('Текущий вопрос №3');
  });

  it('каждый промпт профессии содержит название', () => {
    expect(PYTHON_DEVELOPER_PROMPT).toContain('Python');
    expect(SALES_MANAGER_PROMPT).toContain('продажам');
    expect(HR_MANAGER_PROMPT).toContain('HR');
    expect(MARKETER_PROMPT).toContain('Маркетолог');
    expect(ANALYST_PROMPT).toContain('Аналитика');
  });
});