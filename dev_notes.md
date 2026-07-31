# Dev Notes — Голосовой AI-рекрутер

## 30.07.2026 — Создание приложения

### Что сделано
- Создано полнофункциональное веб-приложение «Голосовой AI-рекрутер»
- Backend: Express + TypeScript + PostgreSQL
  - Шифрование API-ключа AES-256-GCM
  - Интеграция с RouterAI (LLM, STT, TTS)
  - 5 системных промптов для разных профессий
  - Полный REST API для управления настройками и интервью
- Frontend: React + TypeScript + Vite + Tailwind CSS
  - Адаптивный интерфейс с управлением состояниями
  - Запись аудио через MediaRecorder API
  - История диалога с автоскроллом
  - Итоговый отчёт с оценкой
- Тесты: 23 теста (Vitest)

### Используемые модели RouterAI
- LLM: `openai/gpt-5.6-luna` через `POST /api/v1/chat/completions`
- STT: `openai/whisper-large-v4` через `POST /api/v1/audio/transcriptions`
- TTS: `microsoft/mai-voice-2-flash` через `POST /api/v1/audio/speech`

### 30.07.2026 — Добавлен server/.env
- Создан `server/.env` со всеми переменными окружения:
  - `DATABASE_URL` — подключение к PostgreSQL
  - `APP_ENCRYPTION_KEY` — 256-битный ключ AES-256-GCM
  - Настройки порта, CORS, моделей RouterAI, параметров интервью
- Исправлен `.gitignore`: `/backend/.env` → `/server/.env`
- Удалён `.kodikignore` (блокировал создание `.env`)

### Ключевые архитектурные решения
- Все вызовы RouterAI только на backend
- API-ключ шифруется AES-256-GCM перед сохранением в БД
- Полный конвейер аудио → STT → LLM → TTS выполняется одним запросом
- Ошибка TTS не прерывает текстовое интервью
- Интервью восстанавливается из localStorage по ID
- Идемпотентность через x-idempotency-key