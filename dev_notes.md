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
- LLM: `openai/gpt-5.6-luna-pro` через `POST /api/v1/chat/completions`
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
## 03.08.2026 — Исправление TTS (голос агента не воспроизводился)

### Проблема
- Голос `natasha` не существует для модели `microsoft/mai-voice-2-flash` — API RouterAI возвращал 503
- Аудиофайлы сохранялись с расширением `.mp3`, а URL возвращался без него — `express.static` не находил файл
- TTS при создании интервью падал молча (catch с `console.warn`), поэтому `audio_reference` в БД всегда был `null`

### Что исправлено
- **server/.env**: `ROUTERAI_TTS_VOICE=natasha` → `ROUTERAI_TTS_VOICE=ru-RU-Masha:MAI-Voice-2-Flash`
- **server/src/routes/interviews.ts**: fallback `'natasha'` → `'ru-RU-Masha:MAI-Voice-2-Flash'` (2 места)
- **server/src/services/interview.ts**: fallback `'natasha'` → `'ru-RU-Masha:MAI-Voice-2-Flash'`
- **server/src/routes/interviews.ts**: `audioUrl` теперь включает `.mp3` (2 места)
- **server/src/services/interview.ts**: `audioUrl` теперь включает `.mp3`

## 03.08.2026 — Озвучка приветствия

### Проблема
- Приветственное сообщение «Здравствуйте! Я голосовой AI-рекрутер...» создавалось на клиенте как текст без `audioUrl` и никогда не озвучивалось

### Что исправлено
- **server/src/routes/interviews.ts**: добавлен TTS для приветствия — файл `<greetingMsgId>.mp3` сохраняется в `server/audio/`, `audio_reference` записывается в БД, в ответе возвращаются `greetingId` и `greetingAudioUrl`
- **client/src/types/index.ts**: в `CreateInterviewResponse` добавлены поля `greetingId` и `greetingAudioUrl`
- **client/src/hooks/useInterview.ts**: приветствие использует `greetingId` и `greetingAudioUrl` из ответа сервера; при старте интервью сначала проигрывается приветствие, после его окончания — первый вопрос

## 03.08.2026 — Исправление STT (речь не распознавалась)

### Проблема
- Модель `openai/whisper-large-v4` больше не доступна на RouterAI — API возвращал 400 `Model 'openai/whisper-large-v4' not found`
- Вторая проблема: состояние `state` никогда не переключалось в `RECORDING`/`RECORDED` при записи/остановке микрофона, поэтому кнопка «Ответить» не появлялась

### Что исправлено
- **server/.env**: `ROUTERAI_STT_MODEL=openai/whisper-large-v4` → `ROUTERAI_STT_MODEL=fish-audio/transcribe-1`
- **server/src/services/interview.ts**: fallback `'openai/whisper-large-v4'` → `'fish-audio/transcribe-1'`
- **client/src/hooks/useInterview.ts**: в публичный API хука добавлен `setState`
- **client/src/App.tsx**: при старте записи `setState('RECORDING')`, при остановке `setState('RECORDED')` — кнопка «Ответить» теперь появляется

### Проверка
- `POST /api/interviews/:id/answers` с mp3-файлом: STT распознал текст, LLM сформировал следующий вопрос, TTS озвучил его — весь конвейер работает

## 03.08.2026 — Исправление STT (провайдер fish-audio/transcribe-1 недоступен)

### Проблема
- Провайдер `fish-audio/transcribe-1` на RouterAI начал возвращать 503 `Provider returned 503` — сервис временно или постоянно недоступен
- При нажатии «Ответить» сервер возвращал 500 с текстом «Ошибка обработки ответа»

### Что исправлено
- **server/.env**: `ROUTERAI_STT_MODEL=fish-audio/transcribe-1` → `ROUTERAI_STT_MODEL=x-ai/grok-stt-1.0`
- **server/src/services/interview.ts**: fallback `'fish-audio/transcribe-1'` → `'x-ai/grok-stt-1.0'`

### Проверка
- `x-ai/grok-stt-1.0` возвращает 200 с корректной транскрипцией через `POST /api/v1/audio/transcriptions`
- Полный API-запрос `POST /api/interviews/:id/answers` возвращает 200 с транскрипцией, следующим вопросом и TTS-аудио

## 03.08.2026 — Code review: удаление мёртвого кода

### Что удалено/исправлено
- **Мёртвые файлы**: `server/test.mp3`, `server/test_flash.mp3`, `server/test_masha.mp3` — тестовые аудио STT
- **Мёртвый компонент**: `client/src/components/AudioRecorder.tsx` — не использовался (запись через `useAudioRecorder` в `App.tsx`)
- **Дубликаты тестов**: корневая `tests/` (6 файлов) — дублировала `server/tests/`
- **Избыточные скрипты**: `scripts/backend_run.ps1`, `scripts/frontend_run.ps1` — дублировали `package.json` команды
- **Неиспользуемые импорты**: `getRoleTitle` и `z` в `interview.ts`
- **Динамический import()**: заменён на статический в `interviews.ts`
- **Мёртвый код**: `getClient()` в `db/index.ts`, `idempotencyKey` в `processAnswer()`, пустой `useEffect` в `App.tsx`, `timestamp` в типе `Message`
- **Stale default voice**: `'natasha'` → `'ru-RU-Masha:MAI-Voice-2-Flash'` в `routerai.ts`
- **Неиспользуемая зависимость**: `uuid`/`@types/uuid` удалены из `server/package.json`
- **Создан `.env.example`** с шаблоном переменных окружения

## 03.08.2026 — Единая стилистика промптов

### Что сделано
- В **server/src/prompts/common.ts** в конец `buildSystemPrompt()` добавлена фраза: «Говори как носитель русского языка, немного с иронией.» — она применяется ко всем системным промптам

## 03.08.2026 — Docker-контейнеризация

### Что сделано
- **server/Dockerfile**: двухэтапная сборка (node:20-alpine) — builder собирает TypeScript в `dist`, runner запускает продакшн из `dist` под непривилегированным пользователем
- **client/Dockerfile**: двухэтапная сборка — builder собирает Vite-приложение, runner отдаёт статику через nginx:stable-alpine
- **client/nginx.conf**: прокси `/api` → `backend:3000`, SPA-fallback на `index.html`, gzip, `client_max_body_size 50m`
- **docker-compose.yml**: три сервиса в одной bridge-сети `ai-recruiter-net`
  - `postgres:16-alpine` — БД с volume `postgres_data`, healthcheck, порт 5432
  - `backend` — сборка из `server/`, env из `server/.env`, volume `backend_audio`, `depends_on` postgres со `condition: service_healthy`, порт 3000
  - `frontend` — сборка из `client/`, nginx на 80, проброс на 5173
- Добавлены `server/.dockerignore` и `client/.dockerignore`
- В `.gitignore`: `/server/audio/*.mp3` → `/server/audio/`

### UPD: client/nginx.conf упрощён
- Убран прокси `/api` в `client/nginx.conf` — на VDS один nginx, он сам проксирует API на backend
- `client/nginx.conf` теперь содержит только SPA-fallback (try_files)

### UPD: docker-compose.yml
- `CORS_ORIGIN` изменён на `https://recruter.ai-nvkz.ru` (переопределяет `server/.env`)

### Как запустить на VDS
```bash
# 1. Настроить DNS: A-запись recruter.ai-nvkz.ru → IP сервера
# 2. Получить SSL-сертификат:
sudo certbot certonly --nginx -d recruter.ai-nvkz.ru -d www.recruter.ai-nvkz.ru
# 3. Скопировать server/.env на VDS, заполнить
# 4. Запустить:
docker compose up -d --build
# 5. Перезагрузить nginx VDS:
sudo nginx -t && sudo systemctl reload nginx
```

### UPD: Использование существующего PostgreSQL (jira_clone_db)
- Из `docker-compose.yml` удалён сервис `postgres` и volume `postgres_data`
- Backend подключается к PostgreSQL на хосте через `host.docker.internal:5432`
- Добавлен `extra_hosts: - "host.docker.internal:host-gateway"` для Linux Docker
- `DATABASE_URL` изменён на `postgresql://postgres:dasha2009@host.docker.internal:5432/ai_recruiter`

## 24.08.2026 — Добавлена должность C#-разработчика

### Что сделано
- **server/src/types/index.ts**: в `ROLES` добавлена роль `csharp-developer` (title «C#-разработчик»)
- **server/src/prompts/csharp-developer.ts**: создан промпт для собеседования Senior C#-разработчика (оценка .NET-экосистемы, ASP.NET Core, конкурентности, ORM, SOLID, тестирования, высоконагруженных сервисов)
- **server/src/services/interview.ts**: промпт зарегистрирован в `ROLE_PROMPTS`
- **server/src/schemas/index.ts**: `'csharp-developer'` добавлен в enum `CreateInterviewSchema`
- **server/tests/roles.test.ts**: обновлён тест количества профессий (5 → 6), добавлена проверка новой роли
- **server/tests/prompts.test.ts**: добавлена проверка нового промпта

Frontend не менялся — список должностей подтягивается динамически через `GET /api/roles`.

### Проверка
- Все 24 теста проходят (Vitest)

## 24.08.2026 — Служебная страница с итоговыми отчётами

### Цель
Итоговые отчёты собеседований терье не показываются на главной странице — они доступны только на служебной странице `/admin`, защищённой логином/паролем из `server/.env`.

### Backend (уже был готов в рабочей копии до начала задачи, проверен и оставлен без изменений)
- **server/src/routes/admin.ts**: `GET /api/admin/reports` — список завершённых интервью с отчётами, защищено Basic Auth мидлварой, сравнивает с `ADMIN_LOGIN`/`ADMIN_PASSWORD` из `server/.env` (fallback `admin`/`admin123`)
- **server/src/index.ts**: зарегистрирован `adminRouter` на `/api/admin`
- **.env.example**: добавлены `ADMIN_LOGIN`, `ADMIN_PASSWORD`

### Frontend (новое)
- **client/src/components/AdminPage.tsx**: новый компонент — форма ввода логина/пароля, после установки Basic Auth запрашивает и рендерит список `FinalReport` через существующий компонент
- **client/src/main.tsx**: простой роутинг без библиотек — при `pathname` начинающемся с `/admin` рендерится `AdminPage` вместо `App`
- **client/src/components/Header.tsx**: в меню главной страницы добавлена ссылка «📋 Отчёты» на `/admin`
- **client/src/App.tsx**: блок `FinalReport` заменён на короткое уведомление с ссылкой на `/admin`
- **client/src/services/api.ts**: добавлен `getAdminReports(login, password)` — запрос к `GET /api/admin/reports` с заголовком `Authorization: Basic ...`
- **client/src/types/index.ts**: добавлен тип `AdminReportItem`

### Проверка
- `npm run build` в `client/` прошёл без ошибок
- В браузере проверено: неверный логин/пароль → ошибка 401, верный (`admin`/`admin123` из `server/.env`) → список всех завершённых интервью корректно отображается

## 24.08.2026 — Исправление схемы таблицы candidates

### Проблема
- В БД уже существовала таблица `candidates`, созданная ранее с колонкой `experience` (без опечатки) и без колонки `interview_id`
- Из-за `CREATE TABLE IF NOT EXISTS` новая DDL с `experiance` и `interview_id UUID UNIQUE REFERENCES interviews(id)` не применялась к уже существующей таблице

### Что исправлено
- **server/src/db/index.ts**: после `CREATE TABLE IF NOT EXISTS candidates` добавлен блок `DO $$ ... $$` миграции:
  - если есть колонка `experience` и нет `experiance` — `RENAME COLUMN experience TO experiance`
  - если нет колонки `interview_id` — `ADD COLUMN interview_id UUID UNIQUE REFERENCES interviews(id)`
- Миграция идемпотентна и безопасна для повторного запуска при старте сервера

### Проверка
- Миграция применена к рабочей БД, итоговая схема `candidates`: `id, name, email, phone_number, role, experiance, created_at, updated_at, resume, hiring_recommendation, interview_id`
- `npm run build` и `npm test` (26/26) в `server/` прошли без ошибок

## 26.08.2026 — Скрипт очистки базы данных

### Что сделано
- **server/scripts/clean-db.ts**: новый скрипт очистки БД — подключается через `DATABASE_URL` из `server/.env`, в транзакции выполняет `TRUNCATE TABLE <все таблицы public> RESTART IDENTITY CASCADE` (очищает `candidates`, `interviews`, `messages`, `settings`)
- **server/package.json**: добавлен npm-скрипт `clean:db` → `tsx scripts/clean-db.ts`

### Использование
```bash
cd server
npm run clean:db
```

### Проверка
- Скрипт выполнен успешно: `Database cleaned. Truncated tables: candidates, interviews, messages, settings`

## 26.08.2026 — Исправление превышения количества вопросов

### Проблема
- Интервью могло задать больше вопросов, чем запланировано (например, 10 из 7): завершение полностью зависело от решения LLM (`shouldFinish`), а не от жёсткого лимита `planned_question_count`

### Что сделано
- **server/src/services/interview.ts**: в `processAnswer` добавлена жёсткая проверка — если `nextQuestionNumber > interview.planned_question_count`, интервью принудительно завершается через `finishInterview` (формируется итоговый отчёт), вместо генерации следующего вопроса

### Проверка
- `npx tsc --noEmit` в `server/` без ошибок; сервер перезапущен через `tsx watch`