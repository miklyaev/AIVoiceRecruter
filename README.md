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
| LLM | `POST /api/v1/chat/completions` | `openai/gpt-5.6-luna-pro` |
| STT | `POST /api/v1/audio/transcriptions` | `x-ai/grok-stt-1.0` |
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
ROUTERAI_LLM_MODEL=openai/gpt-5.6-luna-pro
ROUTERAI_STT_MODEL=x-ai/grok-stt-1.0
ROUTERAI_TTS_MODEL=microsoft/mai-voice-2-flash
ROUTERAI_TTS_VOICE=ru-RU-Masha:MAI-Voice-2-Flash

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

# Служебная страница с отчётами (/admin)
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin123
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
- `GET /api/roles` — список профессий (Python-разработчик, Менеджер по продажам, HR-менеджер, Маркетолог, Аналитик, C#-разработчик)

### Интервью
- `POST /api/interviews` — создать интервью
- `GET /api/interviews/:id` — получить интервью
- `POST /api/interviews/:id/answers` — отправить ответ (аудио, STT)
- `POST /api/interviews/:id/answers/text` — отправить текстовый ответ в обход STT (debug-режим)
- `POST /api/interviews/:id/finish` — завершить интервью
- `POST /api/interviews/:id/messages/:messageId/speech` — озвучить сообщение

### Служебная страница (админка)
- `GET /api/admin/reports` — список завершённых интервью с итоговыми отчётами. Защищён HTTP Basic Auth, логин/пароль берутся из `ADMIN_LOGIN`/`ADMIN_PASSWORD` в `server/.env`

## Служебный вход

- На главной странице меню «Отчёты» и «Настройки» скрыты — доступна только кнопка «🔐 Служебный вход»
- Вход выполняется по логину/паролю из `ADMIN_LOGIN`/`ADMIN_PASSWORD` (те же, что для `/admin`)
- После успешного входа в шапке главной страницы появляются кнопки «📋 Отчёты», «⚙️ Настройки» и «Выйти»
- Состояние входа хранится в `sessionStorage` (сбрасывается при закрытии вкладки)
- При переходе на `/admin` с активным служебным входом авторизация выполняется автоматически

## Служебная страница с итоговыми отчётами

- Итоговые отчёты собеседований не отображаются на главной странице — после завершения интервью пользователь видит уведомление со ссылкой на служебную страницу
- Доступ к отчётам — через `/admin` на frontend (ссылка «📋 Отчёты» появляется в шапке после служебного входа)
- Страница запрашивает логин и пароль и обращается к `GET /api/admin/reports` с HTTP Basic Auth
- Логин и пароль настраиваются в `server/.env` через `ADMIN_LOGIN` и `ADMIN_PASSWORD` (по умолчанию `admin` / `admin123`)

## Режимы работы (work / debug)

- **work** (по умолчанию) — ответы кандидата записываются с микрофона и распознаются через STT
- **debug** — для ручного интеграционного тестирования: на главной форме появляется поле ввода текста ответа кандидата в обход распознавания речи, кнопки записи с микрофона скрываются
- Переключение режимов — в окне настроек (доступно после служебного входа)
- При каждой загрузке страницы режим сбрасывается на `work`; debug включается вручную
- Текстовый ответ отправляется на `POST /api/interviews/:id/answers/text` и обрабатывается так же, как распознанный ответ (LLM, отчёт, TTS)

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

## Запуск через Docker

Приложение запускается через Docker Compose — поднимаются backend и frontend. PostgreSQL используется существующий (контейнер `jira_clone_db` на том же хосте).

### Требования

- Docker Engine 24+ и Docker Compose v2 (или Docker Desktop)
- Сервер с установленным Docker (VDS или локальная машина)
- Запущенный контейнер PostgreSQL (например, `jira_clone_db` на порту 5432)

### Настройка

1. Создайте базу данных `ai_recruiter` в существующем PostgreSQL:

```sql
CREATE DATABASE ai_recruiter;
```

2. Убедитесь, что в `server/.env` заполнены все переменные:

```env
DATABASE_URL=postgresql://DB_USER_NAME:DB_PASSWORD@host.docker.internal:5432/ai_recruiter
PORT=3000
CORS_ORIGIN=https://recruter.ai-nvkz.ru
ROUTERAI_LLM_MODEL=openai/gpt-5.6-luna-pro
ROUTERAI_STT_MODEL=x-ai/grok-stt-1.0
ROUTERAI_TTS_MODEL=microsoft/mai-voice-2-flash
ROUTERAI_TTS_VOICE=ru-RU-Masha:MAI-Voice-2-Flash
APP_ENCRYPTION_KEY=<ваш-ключ-32-байта-в-hex>
ADMIN_LOGIN=<логин для /admin>
ADMIN_PASSWORD=<пароль для /admin>
```

   > **Важно:** В Docker `DATABASE_URL` использует `host.docker.internal`, чтобы подключиться к PostgreSQL на хосте.

3. Убедитесь, что порт `3000` (backend) свободен.

### Запуск

```bash
# Собрать и запустить все сервисы
docker compose up -d --build
```

После запуска:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

### Просмотр логов

```bash
docker compose logs -f        # все сервисы
docker compose logs -f backend # только backend
docker compose logs -f frontend # только frontend
```

### Остановка

```bash
docker compose down          # остановить и удалить контейнеры
docker compose down -v       # остановить и удалить контейнеры вместе с volumes (данные БД в `backend_audio` будут потеряны)
```

### Архитектура Docker

```
┌──────────┐     ┌──────────┐     ┌──────────────────────┐
│  Nginx   │     │  Backend │     │  PostgreSQL          │
│ (VDS)    │───▶│ (Express) │───▶│  (jira_clone_db)     │
│ :443     │     │ :3000    │     │  :5432 на хосте      │
└────┬─────┘     └──────────┘     └──────────────────────┘
     │            ┌──────────┐
     └──────────▶│  Nginx    │
                  │ (static)  │
                  │ :80       │
                  └──────────┘
```

- Внешний nginx на VDS проксирует `/api/` на backend (:3000), а всё остальное — на frontend (:5173).
- Backend подключается к существующему PostgreSQL через `host.docker.internal:5432` (контейнер `jira_clone_db` на хосте).
- Frontend-контейнер использует собственный nginx для раздачи статики (SPA fallback).
- Контейнеры общаются через внутреннюю bridge-сеть `ai-recruiter-net`.

## Документация RouterAI

- [Документация RouterAI](https://routerai.ru/docs/guides)
- [Каталог моделей](https://routerai.ru/models)
- API Base URL: `https://routerai.ru/api/v1`