# Руководство по рабочему процессу с Claude

> Как мы с Claude работаем над проектом "Город Спорта"

**Дата обновления:** 03 марта 2026
**Версия:** 2.0

---

## Содержание

1. [Общий процесс работы](#общий-процесс-работы)
2. [Типичные сценарии](#типичные-сценарии)
3. [Устройство сервера](#устройство-сервера)
4. [База данных](#база-данных)
5. [Типичные проблемы](#типичные-проблемы)
6. [Быстрые команды](#быстрые-команды)

---

## Общий процесс работы

### Шаг 1: Я даю задание

### Шаг 2: Claude уточняет и согласовывает план
1. Задаёт уточняющие вопросы, если задача неоднозначная
2. Предупреждает о возможных конфликтах или побочных эффектах
3. Кратко описывает план простым языком
4. Ждёт подтверждения перед выполнением

### Шаг 3: Claude делает изменения и коммит
- Вносит изменения в код (frontend/backend)
- Собирает production билд на **локальном Mac** (для frontend)
- Коммитит и пушит на GitHub

### Шаг 4: Команды для сервера
Claude пишет команды — я выполняю в консоли Timeweb.

### Шаг 5: Проверяем результат
- Открываем Mini App в Telegram/VK
- Тестируем функционал

---

## Типичные сценарии

### Сценарий 1: Изменения только во Frontend

**Что делает Claude:**
1. Редактирует файлы в `webapp-react/src/`
2. Собирает билд: `cd webapp-react && npm run build`
3. Копирует в deploy: `cp -r dist/* ../deploy/`
4. Коммитит `webapp-react/src/` + `deploy/` (**включая `deploy/index.html`!**)
5. Пушит на GitHub

> **Важно:** каждый новый билд генерирует JS с новым хэшем в имени файла. `deploy/index.html` ссылается на этот файл — его обязательно нужно коммитить вместе с билдом. Если `index.html` не обновился на сервере — новые изменения не появятся.

**Команды для сервера:**
```bash
cd /var/www/gorodsporta && git pull origin main
# pm2 restart не нужен — изменения только во frontend
```

---

### Сценарий 2: Изменения только в Backend

**Что делает Claude:**
1. Редактирует `bot/index.js`
2. Коммитит и пушит на GitHub

**Команды для сервера:**
```bash
cd /var/www/gorodsporta
git pull origin main
pm2 restart gorodsporta-bot
pm2 logs gorodsporta-bot --lines 10
```

---

### Сценарий 3: Frontend + Backend

**Команды для сервера:**
```bash
cd /var/www/gorodsporta
git pull origin main
pm2 restart gorodsporta-bot
```

---

### Сценарий 4: Изменения в базе данных (SQL миграция)

**Команды для сервера:**
```bash
cd /var/www/gorodsporta
git pull origin main

# Применить миграцию (peer auth, пароль не нужен)
sudo -u postgres psql -d gorodsporta -c "ALTER TABLE ... ;"

# Перезапустить backend
pm2 restart gorodsporta-bot
```

---

### Сценарий 5: Изменения в Admin Panel (webapp-admin)

**Что делает Claude:**
1. Редактирует файлы в `webapp-admin/src/`
2. Собирает билд: `cd webapp-admin && npm run build` (выходит в `deploy-admin/`)
3. Коммитит `webapp-admin/src/` + `deploy-admin/`
4. Пушит на GitHub

**Команды для сервера:**
```bash
cd /var/www/gorodsporta && git pull origin main
# Nginx отдаёт deploy-admin/ автоматически
```

---

## Устройство сервера

### Общая информация

| Параметр | Значение |
|----------|----------|
| **Хостинг** | Timeweb Cloud |
| **IP** | 91.198.220.52 |
| **Домен** | gsbot18.ru |
| **ОС** | Ubuntu 22.04.5 LTS |
| **Node.js** | v20.20.0 |
| **Nginx** | v1.18.0 |
| **PostgreSQL** | 15+ |
| **PM2** | `gorodsporta-bot` |

### Доступ к серверу

**Консоль в браузере:**
https://timeweb.cloud/ → Серверы → gsbot18.ru → Консоль

**SSH:**
```bash
ssh root@gsbot18.ru
```

### Структура проекта на сервере

```
/var/www/gorodsporta/
├── bot/
│   └── index.js               # Backend (Express API + Telegram bot)
│
├── deploy/                     # Frontend Mini App (Nginx раздаёт эти файлы)
│   ├── index.html             # React Mini App
│   ├── qr.html                # Лендинг для QR-новичков
│   ├── privacy/index.html     # Политика конфиденциальности
│   ├── logo.png
│   └── assets/
│       ├── index-*.js
│       └── index-*.css
│
├── deploy-admin/               # Admin Panel (gsbot18.ru/admin/)
│   ├── index.html
│   └── assets/
│
├── webapp-react/               # Исходники React Mini App
│   └── src/
│
├── webapp-admin/               # Исходники Admin Panel
│   └── src/
│
└── *.sql                       # SQL миграции
```

### Nginx

**Основные правила:**
- `/` → `/var/www/gorodsporta/deploy/` (Mini App)
- `/admin/` → `/var/www/gorodsporta/deploy-admin/` (Admin Panel)
- `/api/*` → `http://localhost:3000` (Node.js)
- `/webhook` → `http://localhost:3000`
- `try_files $uri $uri/ /index.html` — SPA-роутинг
- `index.html` отдаётся без кэша; `/assets/` — immutable кэш

**Команды:**
```bash
nginx -t                    # Проверить конфиг
systemctl reload nginx      # Перезагрузить без даунтайма
tail -f /var/log/nginx/error.log
```

### Backend (PM2)

```bash
pm2 status
pm2 restart gorodsporta-bot
pm2 logs gorodsporta-bot --lines 50
pm2 logs gorodsporta-bot --err
```

---

## База данных

**Подключение (peer auth — пароль не нужен):**
```bash
sudo -u postgres psql -d gorodsporta
```

**Основные таблицы:**

| Таблица | Назначение |
|---------|-----------|
| `users` | Пользователи (telegram_id, vk_id, coins, xp) |
| `tasks` | Задания (title, description, day_number) |
| `user_tasks` | Выполненные задания |
| `shop_items` | Товары магазина |
| `purchases` | Покупки пользователей |
| `staff_codes` | Коды от сотрудников |
| `referrals` | Рефералы |
| `reviews` | Отзывы на Яндекс.Картах |

**Таблица `purchases` (актуальная схема):**
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER
item_id         INTEGER
price_paid      INTEGER
purchased_at    TIMESTAMP DEFAULT NOW()
redemption_code VARCHAR(10) UNIQUE   -- Код для выдачи (GS-XXXXXX)
is_redeemed     BOOLEAN DEFAULT FALSE
redeemed_at     TIMESTAMP
```

**Полезные запросы:**
```sql
-- Все задания
SELECT day_number, title FROM tasks ORDER BY day_number;

-- Топ по XP
SELECT first_name, xp, coins FROM users ORDER BY xp DESC LIMIT 10;

-- Активные покупки (не выданные)
SELECT u.first_name, si.title, p.redemption_code, p.purchased_at
FROM purchases p
JOIN users u ON u.id = p.user_id
JOIN shop_items si ON si.id = p.item_id
WHERE p.is_redeemed = false
ORDER BY p.purchased_at DESC;
```

---

## Типичные проблемы

### git pull выдаёт конфликт
```bash
git checkout -- deploy/index.html
git pull origin main
```

### PM2 process not found
```bash
pm2 list   # Посмотреть имена процессов
# Имя процесса: gorodsporta-bot
```

### psql: Peer authentication failed
```bash
# Неправильно:
psql -U postgres -d gorodsporta

# Правильно:
sudo -u postgres psql -d gorodsporta
```

### Новые изменения не появились у пользователей
Скорее всего `deploy/index.html` не был закоммичен. Проверить на сервере:
```bash
cat /var/www/gorodsporta/deploy/index.html
# Убедиться, что там новый хэш JS-файла
```

### История покупок не отображается / чёрный экран
Возможно не запущена SQL миграция. Проверить наличие колонок:
```bash
sudo -u postgres psql -d gorodsporta -c "\d purchases"
```

---

## Быстрые команды

```bash
# Деплой frontend
cd /var/www/gorodsporta && git pull origin main

# Деплой backend
cd /var/www/gorodsporta && git pull origin main && pm2 restart gorodsporta-bot

# Логи
pm2 logs gorodsporta-bot --lines 20

# База данных
sudo -u postgres psql -d gorodsporta

# Бэкап БД
sudo -u postgres pg_dump gorodsporta > backup_$(date +%Y%m%d).sql
```

---

## История изменений

| Дата | Версия | Изменения |
|------|--------|-----------|
| 03.03.2026 | 2.0 | Рефакторинг документа. Магазин: корзина, история покупок, коды выдачи (GS-XXXXXX), redemption flow в админке. Исправлен SQL-доступ (peer auth). Добавлены deploy-admin, privacy |
| 02.03.2026 | 1.4 | 2-этапная регистрация: имя+телефон → проверка по телефону → абонемент. Новый эндпоинт `/api/check-phone`. Сборка frontend перенесена на локальный Mac |
| 02.03.2026 | 1.3 | VK QR-сканер, лендинг qr.html, унификация QR-кодов |
| 01.03.2026 | 1.2 | VK Mini App поддержка |
| 13.02.2026 | 1.0 | Первая версия |

---

*Katya + Claude — "Город Спорта"*
