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
- **server/src/routes/admin.ts**: `GET /api/admin/reports` — список завершённых интервью с отчётами, защищено Basic Auth мидлварой, сравнивает с `ADMIN_LOGIN`/`ADMIN_PASSWORD` из `server/.env`
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

## 28.08.2026 — Миграции базы данных для Docker

### Что сделано
- **server/db/migrations/001_init.sql**: SQL-скрипт создания всех таблиц (`settings`, `interviews`, `messages`, `candidates`) + миграционные ALTER (переименование `experience` → `experiance`, добавление `interview_id`). Идемпотентен — безопасен для повторного запуска
- **server/src/migrate.ts**: скрипт миграции — читает SQL-файл и выполняет его через `DATABASE_URL`; работает и из `dist/` (Docker), и через `tsx` (локально)
- **server/entrypoint.sh**: при старте контейнера сначала выполняет `node dist/migrate.js`, затем запускает приложение
- **server/Dockerfile**: в runner-стадию добавлены `COPY db/` и `COPY entrypoint.sh`, `CMD` заменён на `/app/entrypoint.sh`
- **server/package.json**: добавлен npm-скрипт `migrate` → `tsx src/migrate.ts`

### Использование
```bash
cd server
npm run migrate   # локально
# в Docker миграция выполняется автоматически при старте контейнера
```

### Проверка
- `npm run build` в `server/` прошёл без ошибок, `dist/migrate.js` создан

## 01.09.2026 — Служебный вход и debug-режим для интеграционного тестирования

### Цель
- Убрать с главной формы меню «Отчёты» и «Настройки», заменить на единый «Служебный вход» по логину/паролю
- Добавить поле ручного ввода текста ответа кандидата (в обход STT) для ручного интеграционного тестирования — видимое только в режиме `debug`

### Backend
- **server/src/schemas/index.ts**: добавлена `TextAnswerSchema` (текст 1–5000 символов)
- **server/src/services/interview.ts**: из `processAnswer` вынесена логика обработки распознанного текста в новую `processTranscript(interviewId, transcript)` — `processAnswer` = STT + `processTranscript`, поведение аудио-пути не изменилось
- **server/src/routes/interviews.ts**: новый роут `POST /api/interviews/:id/answers/text` (JSON `{ text }`) — текстовый ответ в обход STT

### Frontend — служебный вход
- **client/src/components/ServiceLoginModal.tsx** (новый): модальное окно входа, проверка через `GET /api/admin/candidates` с Basic Auth (`ADMIN_LOGIN`/`ADMIN_PASSWORD`)
- **client/src/components/Header.tsx**: без входа — одна кнопка «🔐 Служебный вход»; после входа — «📋 Отчёты», «⚙️ Настройки», «Выйти»
- **client/src/App.tsx**: состояние служебного входа в `sessionStorage` (ключ `serviceAuth`, сбрасывается при закрытии вкладки); при выходе режим сбрасывается на `work`
- **client/src/components/AdminPage.tsx**: автовход на `/admin` при активном служебном входе (без повторного ввода пароля)

### Frontend — режимы work/debug
- **client/src/components/InterviewControls.tsx**: новый проп `mode` (`work` | `debug`); в `debug` при состоянии `ASKING` показывается поле ввода текста + кнопка «Ответить» (кнопки записи с микрофона скрыты); в `work` — прежнее поведение с микрофоном
- **client/src/components/SettingsModal.tsx**: переключатель режимов work/debug (radiogroup) — доступен только после служебного входа
- **client/src/App.tsx**: режим по умолчанию всегда `work`, при каждой загрузке страницы сбрасывается (не персистится)
- **client/src/hooks/useInterview.ts**: общая обработка результата ответа вынесена в `applyAnswerResult`, добавлена `sendTextResponse(text)`
- **client/src/services/api.ts**: добавлена `sendTextAnswer(interviewId, text)`

### Проверка
- `npm run build` и `npm test` (26/26) в `server/` — без ошибок; `npm run build` в `client/` — без ошибок
- В браузере проверено: неверный пароль → 401; верный → кнопки «Отчёты»/«Настройки»/«Выйти»; debug-режим — текстовый ответ принят, LLM задал следующий вопрос; переключение на work — поле скрылось, появилась кнопка записи; перезагрузка — режим сброшен на work; `/admin` — автовход; «Выйти» — возврат к «Служебному входу»

## 01.09.2026 — Исправление гонки восстановления интервью (checkSettings)

### Проблема
- При загрузке страницы два эффекта в `useInterview` шли параллельно: `checkSettings()` и восстановление интервью из localStorage
- `checkSettings` через замыкание видело устаревшее `state === 'INITIAL'` и после ответа `GET /api/settings/status` перезаписывало состояние, уже установленное восстановлением интервью: `ASKING`/`COMPLETED` → `READY` — кнопки записи/завершения не появлялись до перезапуска

### Что исправлено
- **client/src/hooks/useInterview.ts**: в `checkSettings` переход в `READY` заменён на функциональный апдейт `setState(prev => (prev === 'INITIAL' || prev === 'API_KEY_REQUIRED') ? 'READY' : prev)`; зависимость `[state]` удалена — замыкание больше не устаревает, параллельно установленное состояние не перетирается

### Проверка
- `npm run build` в `client/` без ошибок

## 02.09.2026 — UI-правки: debug-поле, метка DEBUG в шапке, оформление таблицы «Кандидаты»

### Что сделано
- **client/src/components/InterviewControls.tsx**: debug-поле ввода ответа — `<textarea rows={3}>` вместо `<input>` (высота ×2), ширина на всю карточку, левый край выровнен с текстом вопроса (`pl-5`), Enter — отправка, Shift+Enter — перенос строки
- **client/src/components/Header.tsx**: новый проп `appMode`; в debug-режиме правее статуса «API подключён» — красная метка `DEBUG` (`text-red-600 bg-red-50 border-red-300`, отступ `-ml-[3px]`)
- **client/src/App.tsx**: проброс `appMode` в `Header`
- **client/src/components/CandidatesTable.tsx**: оформление таблицы — шапка `bg-gray-100` с капс-заголовками (`uppercase tracking-wider`), граница шапки 2px, зебра-строки (`odd/even`), hover светло-синий, цветные бейджи рекомендации (зелёный/янтарный/красный/серый) вместо текста

### Проверка
- `npm run build` в `client/` без ошибок, линты чистые
- В браузере: метка DEBUG появляется/исчезает при переключении режимов, таблица `/admin` отображается с новым оформлением (скриншот-проверка)

## 02.09.2026 — Сортировка таблицы «Кандидаты» по имени и должности

### Что сделано
- **client/src/components/CandidatesTable.tsx**: кликабельные заголовки «Имя» и «Должность» — сортировка по возрастанию/убыванию (`localeCompare('ru')`), индикатор ▲/▼/↕, `aria-sort` + `aria-label` на кнопках; сортировка локальная (`useMemo`), порядок строк сервера сохраняется до первого клика

### Проверка
- `npm run build` в `client/` без ошибок, линты чистые
- В браузере: сортировка по имени (asc/desc) и должности (asc) работает, `aria-sort` корректно меняется

## 02.09.2026 — Должность C++-разработчика, новый порядок должностей, удалён Маркетолог

### Что сделано
- **server/src/types/index.ts**: `ROLES` переупорядочен (C#-разработчик, C++-разработчик, Python-разработчик, Аналитик, HR-менеджер, Менеджер по продажам), `marketer` удалён, добавлен `cpp-developer` (title «C++-разработчик»)
- **server/src/prompts/cpp-developer.ts** (новый): промпт собеседования C++-разработчика Middle+/Senior по аналогии с C# (современный C++/STL, RAII, move-семантика, многопоточность, CMake, высоконагруженные системы), произношение «си-плюс-плюс»
- **server/src/prompts/marketer.ts**: удалён
- **server/src/services/interview.ts**: `ROLE_PROMPTS` — marketer заменён на cpp-developer, порядок синхронизирован с ROLES
- **server/src/schemas/index.ts**: enum `CreateInterviewSchema` — `marketer` заменён на `cpp-developer`, порядок синхронизирован
- **server/tests/roles.test.ts**: проверка порядка 6 должностей, наличие cpp-developer, отсутствие marketer
- **server/tests/prompts.test.ts**: MARKETER заменён на CPP_DEVELOPER_PROMPT
- **README.md**: обновлён список должностей
- Роль в БД — строка, миграция не требуется; существующие записи «Маркетолог» останутся в таблице кандидатов, но роль недоступна для новых интервью

### Проверка
- `npm run build` и `npm test` (29/29) в `server/` — без ошибок
- `GET /api/roles` и селекторы на главной и `/admin` — новый порядок, C++ присутствует, Маркетолога нет
- В браузере: перезагрузка с незавершённым интервью в localStorage → состояние `ASKING` сохранено, кнопки «Начать запись»/«Завершить собеседование» появляются сразу; перезагрузка с завершённым интервью → `COMPLETED` сохранён (кнопка «Начать новое собеседование» + уведомление об отчёте)

## 02.09.2026 — Фиксированный текст завершения интервью

### Проблема
- Финальное сообщение («Спасибо за ответы…») генерировалось LLM свободной формулировкой — модель писала «Ниже — итоговая оценка по обсуждённым темам», хотя отчёты перенесены на служебную страницу `/admin`

### Что сделано
- **server/src/services/interview.ts**: константа `FINAL_MESSAGE` — «Спасибо за ответы. Интервью завершено. На служебной странице — итоговая оценка по обсуждённым темам.»; текст жёстко возвращается в обоих путях завершения вместо формулировки LLM: ветка `final` в `generateQuestion` и `finishInterview` (включая запись сообщения в БД); JSON-примеры в промптах синхронизированы
- **e2e/mock-server.ts**: финальное сообщение mock-сервера синхронизировано с `FINAL_MESSAGE`

### Проверка
- `npm run build` и `npm test` (29/29) в `server/`, `npm run build` в `client/` — без ошибок
- Вживую через API: создание интервью → текстовый ответ → `POST /finish` → `recruiterMessage` содержит точный текст `FINAL_MESSAGE`

## 02.09.2026 — Фикс: отчёт с нулевой оценкой при досрочном завершении без ответов

### Проблема
- `POST /finish` для интервью без единого ответа падал 500: LLM законно возвращал `overallScore: 0` + `insufficientData: true`, а `ReportSchema` требовала `min(1)` — 3 попытки исчерпывались, отчёт не сохранялся

### Что сделано
- **server/src/schemas/index.ts**: `ReportSchema.overallScore` — `min(1)` → `min(0)`; ноль легитимен при недостатке данных, фронтенд отображает `0/10` красным + предупреждение `insufficientData`
- **server/tests/schemas.test.ts**: +2 теста — отчёт с `overallScore: 0` + `insufficientData: true` валидируется; отрицательная оценка отклоняется

### Проверка
- `npm run build` и `npm test` (31/31) в `server/` — без ошибок
- Вживую: создание интервью → немедленный `POST /finish` (нуль ответов) → HTTP 200, отчёт `overallScore: 0`, `insufficientData: true`, `hiringRecommendation` «пока не рекомендуется», `recruiterMessage` = `FINAL_MESSAGE`

## 02.09.2026 — Кнопка «Очистить папку с аудио» в настройках

### Что сделано
- **server/src/routes/settings.ts**: новый роут `POST /api/settings/audio/clear` — удаляет все `*.mp3` из `server/audio`, возвращает `{ deleted, message }`; при отсутствии папки возвращает `deleted: 0`
- **client/src/services/api.ts**: функция `clearAudio()`
- **client/src/components/SettingsModal.tsx**: блок «Папка с аудио» с кнопкой «Очистить папку с аудио» — расположен между «Режимом работы приложения» и «API Base URL»; подтверждение через `window.confirm`, результат показывается в общем блоке `message` («Аудифайлы удалены (N шт.)»)

### Проверка
- `npm run build` и `npm test` (31/31) в `server/`, `npm run build` в `client/` — без ошибок
- Вживую: `POST /api/settings/audio/clear` удалил 122 файла; кнопка в модалке настроек удалила тестовый файл, сообщение «Аудифайлы удалены (1 шт.)» отображается
- Вживую: создание интервью → немедленный `POST /finish` (ноль ответов) → HTTP 200, отчёт `overallScore: 0`, `insufficientData: true`, `hiringRecommendation` «пока не рекомендуется», `recruiterMessage` = `FINAL_MESSAGE`