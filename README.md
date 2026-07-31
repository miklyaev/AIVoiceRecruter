# 🎙️ Голосовой AI-рекрутер

Веб-приложение для проведения голосовых собеседований с использованием AI. Приложение проводит структурированное интервью по выбранной профессии, распознаёт ответы кандидата, анализирует их с помощью LLM и формирует итоговую оценку.

## Архитектура

```
Голос пользователя → STT → LLM → TTS → Голос AI-рекрутера
```

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI**: RouterAI API (LLM, STT, TTS)
- **База данных**: PostgreSQL
- **Шифрование**: AES-256-GCM

## Используемый стек

- React 18, TypeScript
- Vite 5, Tailwind CSS 3
- Express 4, Node.js
- PostgreSQL (pg)
- Zod (валидация)
- Vitest (тестирование)
- RouterAI API

## Используемые модели RouterAI

| Компонент | Endpoint | Модель |
|-----------|----------|--------|
| LLM | `POST /api/v1/chat/completions` | `openai/gpt-5.6-luna` |
| STT | `POST /api/v1/audio/transcriptions` | `openai/whisper-large-v4` |
| TTS | `POST /api/v1/audio/speech` | `microsoft/mai-voice-2-flash` |

### Поддерживаемые аудиоформаты

- STT: `audio/webm`, `audio/ogg`, `audio/wav`, `audio/mp3`
- TTS: `mp3` (response_format)

## Установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd ai-voice-recruiter

# Установить зависимости backend
cd server
npm install

# Установить зависимости frontend
cd ../client
npm install
```

## Настройка базы данных

1. Установите PostgreSQL
2. Создайте базу данных:
```sql
CREATE DATABASE ai_recruiter;
```
3. Настройте `DATABASE_URL` в `.env`

## Создание APP_ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Настройка моделей RouterAI

Скопируйте `.env.example` в `.env` и настройте:

```env
PORT=3000
ROUTERAI_BASE_URL=https://routerai.ru/api/v1

# Модели RouterAI
ROUTERAI_LLM_MODEL=openai/gpt-5.6-luna
ROUTERAI_STT_MODEL=openai/whisper-large-v4
ROUTERAI_TTS_MODEL=microsoft/mai-voice-2-flash
ROUTERAI_TTS_VOICE=natasha

# Шифрование
APP_ENCRYPTION_KEY=<ваш-ключ-32-байта-в-hex>

# База данных
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_recruiter

# Лимиты
MAX_AUDIO_DURATION_SECONDS=180
MAX_AUDIO_SIZE_MB=20
INTERVIEW_MIN_QUESTIONS=5
INTERVIEW_TARGET_QUESTIONS=7
INTERVIEW_MAX_QUESTIONS=10
```

## Запуск

```bash
# Backend
cd server
npm run dev

# Frontend (в отдельном терминале)
cd client
npm run dev
```

Frontend будет доступен на `http://localhost:5173`, backend на `http://localhost:3000`.

## API эндпоинты

### Настройки
- `GET /api/settings/status` — статус подключения
- `PUT /api/settings/routerai` — сохранить API-ключ
- `DELETE /api/settings/routerai` — удалить API-ключ
- `POST /api/settings/test` — тест подключения

### Профессии
- `GET /api/roles` — список профессий

### Интервью
- `POST /api/interviews` — создать интервью
- `GET /api/interviews/:id` — получить интервью
- `POST /api/interviews/:id/answers` — отправить ответ
- `POST /api/interviews/:id/finish` — завершить интервью
- `POST /api/interviews/:id/messages/:messageId/speech` — озвучить сообщение

## Безопасность хранения API-ключа

- Ключ шифруется AES-256-GCM со случайным IV
- Зашифрованный ключ хранится в PostgreSQL
- Ключ шифрования хранится в `APP_ENCRYPTION_KEY` (env)
- Полный ключ никогда не возвращается на frontend
- Ключ не попадает в логи
- Ключ не сохраняется в localStorage
- Все обращения к RouterAI выполняются только backend-сервером

## Ограничения браузерной записи

- Используется MediaRecorder API
- Предпочтительный формат: `audio/webm`
- Максимальная длительность записи: 3 минуты
- Минимальный размер файла: 100 байт
- Требуется разрешение доступа к микрофону

## Тестирование

```bash
cd server
npm test
```

## Развёртывание

```bash
# Сборка
cd server && npm run build
cd ../client && npm run build

# Запуск production
cd server
npm start
```

## Документация RouterAI

- [Документация RouterAI](https://routerai.ru/docs/guides)
- [Каталог моделей](https://routerai.ru/models)
- API Base URL: `https://routerai.ru/api/v1`