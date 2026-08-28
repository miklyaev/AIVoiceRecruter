# TODO: Развёртывание приложения на VDS

## 1. Подготовка сервера

```bash
# Установить Docker и Docker Compose v2 (если ещё нет)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
docker compose version   # проверить, что v2
```

## 2. PostgreSQL на хосте

Приложение подключается к **существующему** PostgreSQL на хосте (контейнер `jira_clone_db`, порт 5432) — отдельный контейнер БД в compose не поднимается.

```bash
# Создать базу (если ещё нет)
sudo docker exec -it jira_clone_db psql -U postgres -c "CREATE DATABASE ai_recruiter;"
```

## 3. Скопировать проект и настроить `server/.env`

```bash
git clone <repo-url> && cd ai-voice-recruiter
cp server/.env.example server/.env
```

Заполнить `server/.env` реальными значениями:

```env
DATABASE_URL=postgresql://<реальный_пользователь>:<реальный_пароль>@host.docker.internal:5432/ai_recruiter
APP_ENCRYPTION_KEY=<сгенерировать: openssl rand -hex 32>
CORS_ORIGIN=https://recruter.ai-nvkz.ru
ADMIN_LOGIN=<логин для /admin>
ADMIN_PASSWORD=<надёжный пароль>
```

> ⚠️ **Критично:** в `docker-compose.yml` (строка 11) `DATABASE_URL` захардкожен с плейсхолдерами `DB_USER_NAME:DB_PASSWORD` и **переопределяет** значение из `.env`. Перед запуском замените его на реальные креды PostgreSQL, либо удалите строку 11 из `environment` — тогда возьмётся значение из `server/.env`.

## 4. Запуск

```bash
docker compose up -d --build
```

При старте контейнера backend автоматически выполнит миграцию (`entrypoint.sh` → `node dist/migrate.js`) — таблицы `settings`, `interviews`, `messages`, `candidates` создадутся сами.

Проверка:
```bash
docker compose ps                    # оба контейнера Up
docker compose logs -f backend       # искать "Database migration applied" и "Server running on port 3000"
curl http://localhost:3000/api/health
```

## 5. Внешний nginx на VDS (прокси + SSL)

Frontend слушает `5173`, backend — `3000`. Внешний nginx проксирует `/api/` на backend, остальное — на frontend:

```nginx
server {
    listen 443 ssl;
    server_name recruter.ai-nvkz.ru;

    ssl_certificate     /etc/letsencrypt/live/recruter.ai-nvkz.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recruter.ai-nvkz.ru/privkey.pem;

    client_max_body_size 50m;   # аудио-записи

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
    }
}
```

```bash
# DNS: A-запись recruter.ai-nvkz.ru → IP сервера
# SSL:
sudo certbot certonly --nginx -d recruter.ai-nvkz.ru -d www.recruter.ai-nvkz.ru
sudo nginx -t && sudo systemctl reload nginx
```

## 6. Итоговая проверка

- `https://recruter.ai-nvkz.ru` — открывается форма кандидата
- `https://recruter.ai-nvkz.ru/admin` — служебная страница с отчётами (логин/пароль из `.env`)
- Создать тестовое интервью — проверить, что LLM/STT/TTS работают (API-ключ RouterAI вводится в настройках на главной странице)

**Порядок действий:** Docker → БД → `.env` + правка `docker-compose.yml` → `up -d --build` → nginx + SSL.