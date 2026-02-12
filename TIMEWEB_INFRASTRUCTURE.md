# 🏗️ Инфраструктура проекта "Город Спорта" на Timeweb

> Документация по развертыванию и работе Telegram Mini App на сервере Timeweb

**Дата создания:** 12 февраля 2026
**Версия:** 1.0
**Автор:** Документация для команды разработки

---

## 📋 Содержание

1. [Общая архитектура](#общая-архитектура)
2. [Серверная инфраструктура](#серверная-инфраструктура)
3. [Структура файлов на сервере](#структура-файлов-на-сервере)
4. [Конфигурация Nginx](#конфигурация-nginx)
5. [Backend (Node.js API)](#backend-nodejs-api)
6. [Frontend (React Mini App)](#frontend-react-mini-app)
7. [База данных PostgreSQL](#база-данных-postgresql)
8. [Процесс деплоя](#процесс-деплоя)
9. [Мониторинг и логи](#мониторинг-и-логи)
10. [Troubleshooting](#troubleshooting)

---

## 🏛️ Общая архитектура

Проект состоит из трех основных компонентов:

```
┌─────────────────────────────────────────────────────────────┐
│                        ПОЛЬЗОВАТЕЛЬ                          │
│                     (Telegram Mini App)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   TIMEWEB SERVER (Ubuntu 22.04)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Nginx (Port 80/443) - Reverse Proxy + Static Files  │   │
│  └───────┬──────────────────────────────────┬───────────┘   │
│          │                                  │                │
│          ▼                                  ▼                │
│  ┌──────────────┐                  ┌──────────────┐         │
│  │  Static      │                  │  Node.js     │         │
│  │  Files       │                  │  Backend     │         │
│  │  (React App) │                  │  (Port 3000) │         │
│  │  /deploy/    │                  │  /bot/       │         │
│  └──────────────┘                  └──────┬───────┘         │
│                                            │                 │
│                                            ▼                 │
│                                   ┌──────────────┐          │
│                                   │  PostgreSQL  │          │
│                                   │  (Port 5432) │          │
│                                   └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Telegram Bot)               │
│                  https://bot.workers.dev                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Серверная инфраструктура

### Параметры сервера

- **Хостинг:** Timeweb
- **ОС:** Ubuntu 22.04.5 LTS (GNU/Linux 5.15.0-168-generic x86_64)
- **IP:** 91.198.220.52
- **Домен:** gsbot18.ru
- **SSL:** Let's Encrypt (автоматическое обновление)

### Установленное ПО

```bash
# Node.js
Node.js: v20.20.0
npm: v10.8.2

# Веб-сервер
Nginx: v1.18.0

# База данных
PostgreSQL: (проверить версию: psql --version)

# Процесс-менеджер (если используется)
PM2: (проверить: pm2 --version)
```

### Доступ к серверу

**SSH подключение:**
```bash
ssh root@91.198.220.52
# или
ssh root@gsbot18.ru
```

**Панель управления Timeweb:**
```
https://timeweb.cloud/
```

---

## 📁 Структура файлов на сервере

### Корневая директория проекта

```
/var/www/gorodsporta/
├── .git/                          # Git репозиторий
├── bot/                           # Backend Node.js
│   ├── index.js                  # Express server + API
│   ├── package.json
│   └── node_modules/
├── webapp-react/                  # React приложение (исходники)
│   ├── src/
│   │   ├── components/           # UI компоненты
│   │   ├── pages/                # Страницы
│   │   ├── services/             # API клиент
│   │   ├── contexts/             # React контексты
│   │   └── main.tsx              # Точка входа
│   ├── dist/                     # Собранный билд (после npm run build)
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                      # Переменные окружения
├── deploy/                        # ✅ PRODUCTION файлы (отдает Nginx)
│   ├── index.html                # Главная страница
│   ├── debug.html                # Диагностическая страница
│   ├── assets/                   # JS и CSS
│   │   ├── index-D9_RnF4v.js
│   │   └── index-wjuNMKg6.css
│   ├── favicon.ico
│   ├── robots.txt
│   └── placeholder.svg
├── worker/                        # Cloudflare Worker (Telegram bot)
│   └── bot.js
├── DEPLOY_GUIDE.md               # Руководство по деплою
└── readme.md
```

### Важные пути

| Назначение | Путь |
|-----------|------|
| **Исходники React** | `/var/www/gorodsporta/webapp-react/` |
| **Production файлы (статика)** | `/var/www/gorodsporta/deploy/` |
| **Backend API** | `/var/www/gorodsporta/bot/` |
| **Nginx конфигурация** | `/etc/nginx/sites-available/gorodsporta` |
| **Логи Nginx** | `/var/log/nginx/` |

---

## ⚙️ Конфигурация Nginx

### Файл конфигурации

**Путь:** `/etc/nginx/sites-available/gorodsporta`

**Содержимое:**

```nginx
server {
    server_name gsbot18.ru www.gsbot18.ru;

    # React SPA static files
    root /var/www/gorodsporta/deploy;  # ✅ Отдаем файлы из deploy/
    index index.html;

    # index.html - never cache
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Static assets with hash in name - cache forever
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA: все маршруты -> index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API и webhook -> Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /webhook {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/gsbot18.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gsbot18.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = gsbot18.ru) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name gsbot18.ru www.gsbot18.ru;
    return 404;
}
```

### Команды управления Nginx

```bash
# Проверить конфигурацию
nginx -t

# Перезагрузить конфигурацию (без даунтайма)
systemctl reload nginx

# Перезапустить Nginx
systemctl restart nginx

# Статус
systemctl status nginx

# Просмотр логов
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔧 Backend (Node.js API)

### Расположение

```
/var/www/gorodsporta/bot/
```

### Основной файл

**`bot/index.js`** - Express сервер с:
- REST API для Mini App
- Telegram Bot (grammy)
- Подключение к PostgreSQL

### Параметры подключения к БД

```javascript
const pool = new Pool({
    user: "gsadmin",
    password: "GorodSporta2025!",
    host: "localhost",
    port: 5432,
    database: "gorodsporta"
});
```

⚠️ **ВАЖНО:** Эти данные должны быть в `.env` файле, а не захардкожены!

### API эндпоинты

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/user/:telegramId` | Получить пользователя и его задания |
| POST | `/api/complete-task` | Выполнить задание |
| POST | `/api/survey` | Отправить анкету (задание 1) |
| GET | `/api/shop` | Получить список товаров |
| POST | `/api/purchase` | Купить товар |
| GET | `/api/leaderboard` | Получить рейтинг |
| POST | `/webhook` | Webhook для Telegram бота |

### Запуск и управление

```bash
# Перейти в директорию
cd /var/www/gorodsporta/bot

# Установить зависимости
npm install

# Запуск в режиме разработки
node index.js

# Запуск через PM2 (если настроен)
pm2 start index.js --name bot
pm2 restart bot
pm2 stop bot
pm2 logs bot

# Статус PM2
pm2 status
```

### Порты

- **Backend API:** `http://localhost:3000`
- **Admin панель:** `http://localhost:8080`

---

## ⚛️ Frontend (React Mini App)

### Исходники

```
/var/www/gorodsporta/webapp-react/
```

### Технологический стек

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** TailwindCSS + shadcn/ui
- **State Management:** @tanstack/react-query
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Telegram SDK:** `https://telegram.org/js/telegram-web-app.js`

### Переменные окружения

**Файл:** `/var/www/gorodsporta/webapp-react/.env`

```env
VITE_API_BASE_URL=https://gsbot18.ru
```

### Конфигурация Vite

**`vite.config.ts`:**

```typescript
export default defineConfig({
  base: "/",  // ✅ Важно для правильных путей
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

### Сборка production билда

```bash
# Перейти в директорию
cd /var/www/gorodsporta/webapp-react

# Установить зависимости
npm install

# Собрать production билд
npm run build

# Результат будет в webapp-react/dist/
```

### Копирование в deploy

```bash
# Из корня проекта
cd /var/www/gorodsporta

# Скопировать собранные файлы
cp -r webapp-react/dist/* deploy/
```

---

## 🗄️ База данных PostgreSQL

### Параметры подключения

```
Host: localhost
Port: 5432
Database: gorodsporta
User: gsadmin
Password: GorodSporta2025!
```

### Структура таблиц

#### 1. `users` - Пользователи

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    coins INT DEFAULT 0,
    xp INT DEFAULT 0,
    survey_data JSONB,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `tasks` - Задания

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    day_number INT UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    coins_reward INT DEFAULT 0,
    verification_type VARCHAR(50), -- 'qr', 'code', 'self', 'survey', 'app_code'
    verification_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `user_tasks` - Выполненные задания

```sql
CREATE TABLE user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    task_id INT REFERENCES tasks(id),
    status VARCHAR(50), -- 'completed'
    completed_at TIMESTAMP,
    verified_by VARCHAR(50),
    UNIQUE(user_id, task_id)
);
```

#### 4. `shop_items` - Товары в магазине

```sql
CREATE TABLE shop_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    price INT NOT NULL,
    icon VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `purchases` - Покупки

```sql
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    item_id INT REFERENCES shop_items(id),
    price_paid INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `staff_codes` - Коды сотрудников

```sql
CREATE TABLE staff_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    task_day INT,
    usage_limit INT DEFAULT 999999,
    used_count INT DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Полезные запросы

```bash
# Подключение к БД
psql -U gsadmin -d gorodsporta

# Список пользователей
SELECT telegram_id, first_name, coins, xp FROM users ORDER BY xp DESC LIMIT 10;

# Статистика по заданиям
SELECT
    t.day_number,
    t.title,
    COUNT(ut.id) as completed_count
FROM tasks t
LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.status = 'completed'
GROUP BY t.id, t.day_number, t.title
ORDER BY t.day_number;

# Выход из psql
\q
```

---

## 🚀 Процесс деплоя

### Автоматический деплой через Git

#### Шаг 1: Подключение к серверу

```bash
ssh root@gsbot18.ru
```

#### Шаг 2: Переход в директорию проекта

```bash
cd /var/www/gorodsporta
```

#### Шаг 3: Получение последних изменений

```bash
git pull origin main
```

Если есть конфликты или нужен hard reset:

```bash
git fetch origin
git reset --hard origin/main
```

#### Шаг 4: Сборка frontend

```bash
cd webapp-react
npm install
npm run build
```

#### Шаг 5: Копирование файлов

```bash
cd ..
cp -r webapp-react/dist/* deploy/
```

#### Шаг 6: Обновление backend (если нужно)

```bash
cd bot
npm install

# Если используется PM2
pm2 restart bot

# Или просто перезапустить процесс Node.js
```

#### Шаг 7: Перезагрузка Nginx

```bash
nginx -t
systemctl reload nginx
```

#### Шаг 8: Проверка

Откройте в браузере:
- https://gsbot18.ru/
- https://gsbot18.ru/debug.html

---

### 📜 Скрипт для автоматического деплоя

Создайте файл `/var/www/gorodsporta/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Начинаем деплой Город Спорта..."

# Переход в директорию проекта
cd /var/www/gorodsporta

# Получение изменений из Git
echo "📥 Получаем изменения из GitHub..."
git pull origin main

# Сборка frontend
echo "🔨 Собираем frontend..."
cd webapp-react
npm install --production=false
npm run build

# Копирование файлов
echo "📦 Копируем собранные файлы в deploy/..."
cd ..
cp -r webapp-react/dist/* deploy/

# Обновление backend
echo "🔄 Обновляем backend..."
cd bot
npm install --production

# Перезапуск PM2 (если используется)
if command -v pm2 &> /dev/null; then
    echo "🔄 Перезапускаем PM2..."
    pm2 restart bot
else
    echo "⚠️ PM2 не найден, пропускаем перезапуск"
fi

# Перезагрузка Nginx
echo "🔄 Перезагружаем Nginx..."
nginx -t && systemctl reload nginx

echo "✅ Деплой завершен!"
echo "🌐 Проверьте: https://gsbot18.ru/"
echo "🔍 Диагностика: https://gsbot18.ru/debug.html"
```

**Сделать исполняемым:**

```bash
chmod +x /var/www/gorodsporta/deploy.sh
```

**Использование:**

```bash
cd /var/www/gorodsporta
./deploy.sh
```

---

## 📊 Мониторинг и логи

### Логи Nginx

```bash
# Access логи (все запросы)
tail -f /var/log/nginx/access.log

# Error логи
tail -f /var/log/nginx/error.log

# Поиск ошибок за последний час
grep "error" /var/log/nginx/error.log | tail -100
```

### Логи Node.js Backend

```bash
# Если используется PM2
pm2 logs bot

# Только ошибки
pm2 logs bot --err

# Последние 100 строк
pm2 logs bot --lines 100
```

### Мониторинг процессов

```bash
# Список процессов Node.js
ps aux | grep node

# Использование ресурсов
top
htop

# PM2 мониторинг
pm2 monit
```

### Проверка портов

```bash
# Какие порты слушают
netstat -tulpn | grep LISTEN

# Проверка порта 3000 (backend)
netstat -tulpn | grep 3000

# Проверка порта 5432 (PostgreSQL)
netstat -tulpn | grep 5432
```

---

## 🔧 Troubleshooting

### Проблема: Приложение не загружается

**Диагностика:**

1. Откройте https://gsbot18.ru/debug.html
2. Проверьте все тесты:
   - ✅ Telegram WebApp SDK
   - ✅ API доступность
   - ✅ Загрузка ассетов

3. Проверьте логи Nginx:
```bash
tail -f /var/log/nginx/error.log
```

4. Проверьте, что файлы на месте:
```bash
ls -la /var/www/gorodsporta/deploy/
```

**Решение:**

- Если 404 на ассеты → пересобрать и скопировать билд
- Если ошибки API → проверить backend
- Если белый экран → проверить консоль браузера (F12)

---

### Проблема: API не отвечает

**Диагностика:**

```bash
# Проверить, запущен ли процесс
pm2 status

# Проверить логи
pm2 logs bot

# Проверить порт
curl http://localhost:3000/api/leaderboard
```

**Решение:**

```bash
# Перезапустить backend
pm2 restart bot

# Если PM2 не используется - найти процесс
ps aux | grep "node.*bot"

# Запустить вручную
cd /var/www/gorodsporta/bot
node index.js
```

---

### Проблема: База данных недоступна

**Диагностика:**

```bash
# Проверить статус PostgreSQL
systemctl status postgresql

# Попробовать подключиться
psql -U gsadmin -d gorodsporta
```

**Решение:**

```bash
# Перезапустить PostgreSQL
systemctl restart postgresql

# Проверить пароль
# В bot/index.js должен быть правильный пароль
```

---

### Проблема: После git pull ничего не изменилось

**Причина:** Забыли пересобрать и скопировать билд

**Решение:**

```bash
cd /var/www/gorodsporta/webapp-react
npm run build
cd ..
cp -r webapp-react/dist/* deploy/
systemctl reload nginx
```

---

### Проблема: 502 Bad Gateway

**Причина:** Backend не запущен или не отвечает на порту 3000

**Диагностика:**

```bash
# Проверить, слушает ли что-то порт 3000
netstat -tulpn | grep 3000

# Проверить логи Nginx
tail -f /var/log/nginx/error.log
```

**Решение:**

```bash
cd /var/www/gorodsporta/bot
pm2 restart bot
# или
node index.js
```

---

## 🔐 Безопасность

### Важные замечания

1. **Секреты в коде:**
   - ❌ НЕ храните пароли БД и токены в коде
   - ✅ Используйте `.env` файлы
   - ✅ Добавьте `.env` в `.gitignore`

2. **Telegram Bot Token:**
   - Текущий: `8091797199:AAHAhjl7ooj4ajYdoxZwl-B4AtRlrj_WZqI`
   - ⚠️ Вынести в переменные окружения!

3. **База данных:**
   - Текущий пароль: `GorodSporta2025!`
   - ⚠️ Не должен быть в публичном репозитории!

4. **Firewall:**
   - Закрыть все порты кроме 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - PostgreSQL (5432) должен быть доступен только локально

5. **SSL сертификат:**
   - Автоматическое обновление через certbot
   - Проверка: `certbot certificates`

---

## 📞 Контакты и ссылки

### Важные URL

- **Сайт:** https://gsbot18.ru/
- **Диагностика:** https://gsbot18.ru/debug.html
- **GitHub:** https://github.com/votkatya/gsbot
- **Telegram Bot:** @gorodsporta_bot (или как называется)

### Панели управления

- **Timeweb:** https://timeweb.cloud/
- **Cloudflare (Worker):** https://dash.cloudflare.com/

### Документация

- **Telegram Mini Apps:** https://core.telegram.org/bots/webapps
- **Vite:** https://vitejs.dev/
- **React:** https://react.dev/
- **Nginx:** https://nginx.org/ru/docs/

---

## 📝 Чеклист для нового разработчика

### Первое подключение

- [ ] Получить SSH доступ к серверу
- [ ] Клонировать репозиторий локально: `git clone https://github.com/votkatya/gsbot.git`
- [ ] Установить Node.js v20+ локально
- [ ] Установить зависимости: `cd webapp-react && npm install`
- [ ] Запустить dev сервер: `npm run dev`
- [ ] Изучить структуру проекта

### Перед изменениями

- [ ] Создать новую ветку: `git checkout -b feature/название`
- [ ] Убедиться, что локально всё работает
- [ ] Протестировать изменения
- [ ] Закоммитить: `git commit -m "описание"`
- [ ] Запушить: `git push origin feature/название`

### Деплой на production

- [ ] Подключиться к серверу: `ssh root@gsbot18.ru`
- [ ] Перейти в директорию: `cd /var/www/gorodsporta`
- [ ] Обновить код: `git pull origin main`
- [ ] Собрать frontend: `cd webapp-react && npm run build`
- [ ] Скопировать файлы: `cp -r dist/* ../deploy/`
- [ ] Перезапустить backend (если нужно): `pm2 restart bot`
- [ ] Перезагрузить Nginx: `systemctl reload nginx`
- [ ] Проверить: https://gsbot18.ru/

---

## 🎯 Быстрые команды (шпаргалка)

```bash
# === Подключение ===
ssh root@gsbot18.ru

# === Переход в проект ===
cd /var/www/gorodsporta

# === Обновление из GitHub ===
git pull origin main

# === Сборка frontend ===
cd webapp-react && npm install && npm run build && cd ..

# === Копирование в production ===
cp -r webapp-react/dist/* deploy/

# === Перезагрузка Nginx ===
nginx -t && systemctl reload nginx

# === Перезапуск backend ===
pm2 restart bot

# === Логи ===
tail -f /var/log/nginx/error.log
pm2 logs bot

# === База данных ===
psql -U gsadmin -d gorodsporta
```

---

## 📚 История изменений

| Дата | Версия | Изменения |
|------|--------|-----------|
| 12.02.2026 | 1.0 | Первая версия документации |

---

**Документ создан для команды разработки проекта "Город Спорта"**
*При возникновении вопросов обращайтесь к ответственному за инфраструктуру*
