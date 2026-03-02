# 🤝 Руководство по рабочему процессу с Claude

> Как мы с Claude работаем над проектом "Город Спорта"

**Дата создания:** 13 февраля 2026
**Версия:** 1.0

---

## 📋 Содержание

1. [Общий процесс работы](#общий-процесс-работы)
2. [Типичные сценарии](#типичные-сценарии)
3. [Деплой на сервер](#деплой-на-сервер)
4. [Устройство сервера](#устройство-сервера)
5. [Чеклист для каждого изменения](#чеклист-для-каждого-изменения)

---

## 🔄 Общий процесс работы

### Шаг 1: Я даю задание
Примеры заданий:
- "Добавь новое задание в блок 2"
- "Исправь ошибку с проверкой кодов"
- "Измени описание задания 5"
- "Добавь новую страницу в приложение"

### Шаг 2: Claude делает изменения
Claude:
1. ✅ Анализирует задачу
2. ✅ Вносит изменения в код (frontend/backend)
3. ✅ Тестирует локально (если возможно)
4. ✅ Собирает production билд (для frontend)

### Шаг 3: Claude создает коммит
```bash
# Claude автоматически выполняет:
git add <измененные файлы>
git commit -m "Описание изменений

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Шаг 4: Claude пушит на GitHub
```bash
git push origin main
```

### Шаг 5: Claude дает инструкции для сервера
Claude пишет пошаговые команды, которые нужно выполнить в **консоли Timeweb**.

### Шаг 6: Я выполняю команды на сервере
Открываю консоль Timeweb и копирую команды от Claude.

### Шаг 7: Проверяем результат
- Открываем Mini App в Telegram
- Проверяем изменения
- Тестируем функционал

---

## 🎯 Типичные сценарии

### Сценарий 1: Изменения только во Frontend

**Пример:** "Измени дизайн карточки задания"

**Что делает Claude:**
1. Редактирует файлы в `webapp-react/src/`
2. Коммитит изменения (src/ и package.json если нужно)
3. Пушит на GitHub

> ⚠️ `dist/` в `.gitignore` — сборка делается на сервере, не локально.

**Команды для сервера:**
```bash
cd /var/www/gorodsporta/webapp-react && git pull && npm install && npm run build && cp -r dist/* /var/www/gorodsporta/deploy/
```

---

### Сценарий 2: Изменения только в Backend

**Пример:** "Исправь проверку кодов в API"

**Что делает Claude:**
1. Редактирует `bot/index.js`
2. Коммитит изменения
3. Пушит на GitHub

**Команды для сервера:**
```bash
# 1. Перейти в проект
cd /var/www/gorodsporta

# 2. Получить изменения
git pull origin main

# 3. Перезапустить backend
pm2 restart gorodsporta-bot

# 4. Проверить логи
pm2 logs gorodsporta-bot --lines 5
```

---

### Сценарий 3: Изменения в Frontend + Backend

**Пример:** "Добавь новый эндпоинт API и страницу для него"

**Что делает Claude:**
1. Редактирует `bot/index.js` (backend)
2. Редактирует файлы в `webapp-react/src/` (frontend)
3. Собирает production билд
4. Копирует в `deploy/`
5. Коммитит все изменения
6. Пушит на GitHub

**Команды для сервера:**
```bash
# 1. Перейти в проект
cd /var/www/gorodsporta

# 2. Получить изменения
git pull origin main

# 3. Перезапустить backend
pm2 restart gorodsporta-bot

# 4. Перезагрузить nginx
systemctl reload nginx

# 5. Проверить статус
pm2 status
systemctl status nginx --no-pager
```

---

### Сценарий 4: Изменения в базе данных

**Пример:** "Обнови описания заданий в БД"

**Что делает Claude:**
1. Создает SQL миграцию (например, `update_tasks_descriptions.sql`)
2. Коммитит SQL файл
3. Пушит на GitHub

**Команды для сервера:**
```bash
# 1. Перейти в проект
cd /var/www/gorodsporta

# 2. Получить изменения
git pull origin main

# 3. Применить SQL миграцию
PGPASSWORD='GorodSporta2025!' psql -U gsadmin -h localhost -d gorodsporta -f <имя_файла>.sql

# 4. Если затронут backend - перезапустить
pm2 restart gorodsporta-bot
```

---

### Сценарий 5: Добавлены новые зависимости в Backend

**Пример:** "Добавь библиотеку для работы с изображениями"

**Что делает Claude:**
1. Обновляет `bot/package.json`
2. Редактирует код
3. Коммитит изменения
4. Пушит на GitHub

**Команды для сервера:**
```bash
# 1. Перейти в проект
cd /var/www/gorodsporta

# 2. Получить изменения
git pull origin main

# 3. Установить новые зависимости
cd bot
npm install

# 4. Перезапустить backend
pm2 restart gorodsporta-bot

# 5. Проверить логи
pm2 logs gorodsporta-bot --lines 10
```

---

## 🚀 Деплой на сервер

### Полный процесс деплоя (все изменения)

```bash
# ============================================
# ПОЛНЫЙ ДЕПЛОЙ ПРОЕКТА "ГОРОД СПОРТА"
# ============================================

# 1. Подключиться к серверу
# Открыть консоль Timeweb в браузере:
# https://timeweb.cloud/ → Серверы → gsbot18.ru → Консоль

# 2. Перейти в директорию проекта
cd /var/www/gorodsporta

# 3. Получить последние изменения с GitHub
git pull origin main

# 4. Если были изменения в backend зависимостях
cd bot
npm install
cd ..

# 5. Если были SQL миграции
PGPASSWORD='GorodSporta2025!' psql -U gsadmin -h localhost -d gorodsporta -f update_tasks_descriptions.sql

# 6. Перезапустить backend
pm2 restart gorodsporta-bot

# 7. Перезагрузить nginx
systemctl reload nginx

# 8. Проверить статус всех сервисов
pm2 status
systemctl status nginx --no-pager

# 9. Посмотреть логи backend
pm2 logs gorodsporta-bot --lines 20

# ============================================
# ГОТОВО! Проверьте https://gsbot18.ru/
# ============================================
```

---

## 🖥️ Устройство сервера

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
| **PM2** | Установлен |

### Доступ к серверу

**Вариант 1: Консоль в браузере (рекомендуется)**
1. Открыть https://timeweb.cloud/
2. Войти в аккаунт
3. Перейти в "Серверы"
4. Выбрать сервер gsbot18.ru
5. Нажать "Консоль"

**Вариант 2: SSH**
```bash
ssh root@gsbot18.ru
# или
ssh root@91.198.220.52
```

### Структура проекта на сервере

```
/var/www/gorodsporta/
├── bot/                        # Backend (Node.js + Express)
│   ├── index.js               # Главный файл API
│   ├── package.json           # Зависимости
│   └── node_modules/          # Установленные библиотеки
│
├── deploy/                     # Frontend (Production файлы) ← Nginx отдает эти файлы
│   ├── index.html             # Главная страница (React Mini App)
│   ├── qr.html                # Лендинг для новичков, сканирующих QR камерой телефона
│   ├── logo.png               # Логотип клуба (для qr.html)
│   ├── debug.html             # Диагностическая страница
│   └── assets/                # JS и CSS
│       ├── index-*.js
│       └── index-*.css
│
├── webapp-react/               # Frontend (Исходники React)
│   ├── src/                   # Исходный код
│   ├── public/                # Статические файлы (копируются в dist/ при сборке)
│   │   ├── qr.html            # Лендинг-заглушка
│   │   └── logo.png           # Логотип клуба
│   ├── dist/                  # Собранный билд (→ копируется в deploy/)
│   ├── package.json
│   └── vite.config.ts
│
├── worker/                     # Cloudflare Worker (Telegram bot webhook)
│
├── *.sql                       # SQL миграции
└── *.md                        # Документация
```

### Как работает сервер

```
┌─────────────────────────────────────────────────┐
│          ПОЛЬЗОВАТЕЛЬ (Telegram Mini App)       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Nginx (Port 443)   │
         │   gsbot18.ru         │
         └─────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ Static Files │    │  Node.js Backend │
│  /deploy/    │    │  PM2: gorodsporta-bot │
│              │    │  Port: 3000       │
└──────────────┘    └────────┬──────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Port: 5432    │
                    │   DB: gorodsporta │
                    └─────────────────┘
```

### Nginx конфигурация

**Файл:** `/etc/nginx/sites-available/gorodsporta`

**Основные правила:**
- `/` → Static files из `/var/www/gorodsporta/deploy/`
- `/api/*` → Proxy на `http://localhost:3000` (Node.js backend)
- `/webhook` → Proxy на `http://localhost:3000` (Telegram webhook)
- SSL сертификат от Let's Encrypt (автообновление)

**Команды управления Nginx:**
```bash
# Проверить конфигурацию
nginx -t

# Перезагрузить (без даунтайма)
systemctl reload nginx

# Перезапустить
systemctl restart nginx

# Статус
systemctl status nginx

# Логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backend (PM2)

**Процесс:** `gorodsporta-bot`
**Файл:** `/var/www/gorodsporta/bot/index.js`
**Port:** 3000

**Команды управления PM2:**
```bash
# Статус
pm2 status

# Перезапустить
pm2 restart gorodsporta-bot

# Остановить
pm2 stop gorodsporta-bot

# Запустить
pm2 start gorodsporta-bot

# Логи (live)
pm2 logs gorodsporta-bot

# Последние 50 строк логов
pm2 logs gorodsporta-bot --lines 50

# Только ошибки
pm2 logs gorodsporta-bot --err

# Мониторинг
pm2 monit
```

### База данных PostgreSQL

**Параметры подключения:**
```
Host: localhost
Port: 5432
Database: gorodsporta
User: gsadmin
Password: GorodSporta2025!
```

**Подключение к БД:**
```bash
# С паролем через переменную окружения
PGPASSWORD='GorodSporta2025!' psql -U gsadmin -h localhost -d gorodsporta

# psql попросит пароль
psql -U gsadmin -h localhost -d gorodsporta
```

**Основные таблицы:**
- `users` - Пользователи Telegram
- `tasks` - Список заданий
- `user_tasks` - Выполненные задания
- `shop_items` - Товары в магазине
- `purchases` - Покупки
- `staff_codes` - Коды от сотрудников

**Полезные SQL запросы:**
```sql
-- Список всех заданий
SELECT * FROM tasks ORDER BY day_number;

-- Топ-10 пользователей по XP
SELECT telegram_id, first_name, xp, coins FROM users ORDER BY xp DESC LIMIT 10;

-- Статистика выполнения заданий
SELECT
    t.day_number,
    t.title,
    COUNT(ut.id) as completed_count
FROM tasks t
LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.status = 'completed'
GROUP BY t.id
ORDER BY t.day_number;

-- Выход из psql
\q
```

---

## ✅ Чеклист для каждого изменения

### Перед началом работы
- [ ] Я четко сформулировал задачу для Claude
- [ ] Я понимаю, какие части проекта будут изменены (frontend/backend/БД)

### Процесс разработки
- [ ] Claude внес изменения в код
- [ ] Claude собрал production билд (если frontend)
- [ ] Claude создал коммит с описанием
- [ ] Claude запушил на GitHub
- [ ] Claude предоставил команды для сервера

### Деплой на сервер
- [ ] Открыл консоль Timeweb
- [ ] Выполнил `cd /var/www/gorodsporta`
- [ ] Выполнил `git pull origin main`
- [ ] Если backend: выполнил `pm2 restart gorodsporta-bot`
- [ ] Если frontend: выполнил `systemctl reload nginx`
- [ ] Если SQL: применил миграцию
- [ ] Если новые зависимости: выполнил `npm install`

### Проверка
- [ ] Проверил статус: `pm2 status` и `systemctl status nginx`
- [ ] Посмотрел логи: `pm2 logs gorodsporta-bot --lines 10`
- [ ] Открыл https://gsbot18.ru/ в браузере
- [ ] Открыл Mini App в Telegram
- [ ] Протестировал изменения
- [ ] Убедился, что всё работает корректно

### Если что-то пошло не так
- [ ] Посмотрел логи: `pm2 logs gorodsporta-bot --err`
- [ ] Проверил логи Nginx: `tail -f /var/log/nginx/error.log`
- [ ] Скопировал ошибку и отправил Claude
- [ ] Claude анализирует и исправляет проблему

---

## 🔥 Типичные проблемы и решения

### Проблема 1: "Cannot find module"

**Причина:** Не установлены npm зависимости

**Решение:**
```bash
cd /var/www/gorodsporta/bot
npm install
pm2 restart gorodsporta-bot
```

---

### Проблема 2: "git merge conflict"

**Причина:** Локальные изменения на сервере конфликтуют с GitHub

**Решение:**
```bash
cd /var/www/gorodsporta
git stash  # Сохранить локальные изменения
git pull origin main
git stash pop  # Вернуть изменения (если нужно)
```

Или жесткий сброс (ОСТОРОЖНО - удалит локальные изменения):
```bash
git reset --hard origin/main
```

---

### Проблема 3: "PM2 process not found"

**Причина:** Процесс PM2 не запущен или имеет другое имя

**Решение:**
```bash
# Посмотреть список процессов
pm2 list

# Если нет gorodsporta-bot, запустить:
cd /var/www/gorodsporta/bot
pm2 start index.js --name gorodsporta-bot
```

---

### Проблема 4: Нехватка памяти при сборке

**Причина:** На сервере недостаточно RAM для `npm run build`

**Решение:** Сборка делается **на сервере** (512MB+ RAM справляется). Команда деплоя:
```bash
cd /var/www/gorodsporta/webapp-react && git pull && npm install && npm run build && cp -r dist/* /var/www/gorodsporta/deploy/
```

> ⚠️ Файлы из `webapp-react/public/` (например `qr.html`, `logo.png`) автоматически попадают в `dist/` при сборке и затем в `deploy/`.

---

### Проблема 5: База данных не доступна

**Причина:** PostgreSQL не запущен или неверный пароль

**Решение:**
```bash
# Проверить статус PostgreSQL
systemctl status postgresql

# Перезапустить PostgreSQL
systemctl restart postgresql

# Проверить подключение
PGPASSWORD='GorodSporta2025!' psql -U gsadmin -h localhost -d gorodsporta -c "SELECT 1;"
```

---

## 📞 Быстрые команды (шпаргалка)

```bash
# === ДЕПЛОЙ ОДНОЙ СТРОКОЙ (только pull + restart) ===
cd /var/www/gorodsporta && git pull origin main && pm2 restart gorodsporta-bot && systemctl reload nginx

# === ПРОВЕРКА СТАТУСА ===
pm2 status && systemctl status nginx --no-pager

# === ЛОГИ ===
pm2 logs gorodsporta-bot --lines 20
tail -f /var/log/nginx/error.log

# === БАЗА ДАННЫХ ===
PGPASSWORD='GorodSporta2025!' psql -U gsadmin -h localhost -d gorodsporta

# === ПЕРЕЗАПУСК ВСЕГО ===
pm2 restart gorodsporta-bot && systemctl restart nginx && systemctl restart postgresql
```

---

## 📚 Полезные ссылки

### Проект
- **Сайт:** https://gsbot18.ru/
- **Диагностика:** https://gsbot18.ru/debug.html
- **GitHub:** https://github.com/votkatya/gsbot

### Документация проекта
- `TIMEWEB_INFRASTRUCTURE.md` - Детальная инфраструктура сервера
- `DEPLOY_GUIDE.md` - Руководство по деплою
- `TASKS_UPDATE_GUIDE.md` - Обновление заданий
- `CARD_DESIGN_UPDATES.md` - Дизайн карточек

### Панели управления
- **Timeweb:** https://timeweb.cloud/
- **GitHub:** https://github.com/votkatya/gsbot

### Внешняя документация
- **Telegram Mini Apps:** https://core.telegram.org/bots/webapps
- **PM2:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx:** https://nginx.org/ru/docs/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 🎓 Советы по работе

### Для меня (пользователя)

1. **Формулируй задачи четко**
   - ✅ "Добавь проверку на регистронезависимость для кодов"
   - ❌ "Сделай лучше проверку кодов"

2. **Всегда показывай результат команд**
   - После выполнения команд на сервере, копируй вывод и показывай Claude
   - Это помогает выявить проблемы

3. **Проверяй в Telegram Mini App**
   - После каждого деплоя тестируй изменения в реальном приложении
   - Не надейся только на логи

4. **Делай бэкапы БД**
   - Перед большими изменениями в SQL
   ```bash
   pg_dump -U gsadmin -h localhost gorodsporta > backup_$(date +%Y%m%d).sql
   ```

### Для Claude

1. **Сборка frontend делается на сервере**
   - `dist/` в `.gitignore` — коммитить только исходники (`src/`, `package.json`)
   - Сервер справляется со сборкой (512MB+ RAM)
   - Команда деплоя: `git pull && npm install && npm run build && cp -r dist/* /var/www/gorodsporta/deploy/`

2. **Давай пошаговые инструкции**
   - Команды должны быть готовы для копирования
   - Объяснять, что делает каждая команда

3. **Проверяй совместимость**
   - Убедись, что изменения не сломают существующий функционал
   - Регрессионные тесты (хотя бы мысленно)

4. **Коммиты должны быть информативными**
   - Описывать ЧТО изменено и ЗАЧЕМ
   - Добавлять Co-Authored-By для отслеживания

---

## 📝 История изменений этого документа

| Дата | Версия | Изменения |
|------|--------|-----------|
| 02.03.2026 | 1.3 | VK QR-сканер (`VKWebAppOpenCodeReader`), лендинг `qr.html`, унификация QR-кодов (URL + ручной код одинаковые), парсер URL в `handleQRScanned` |
| 01.03.2026 | 1.2 | Исправлена ошибка VK "Приложение не инициализировано" (двойной VKWebAppInit), добавлена поддержка VK Mini App |
| 16.02.2026 | 1.1 | Добавлено автооткрытие блоков, исправления админки, страница рефералов |
| 13.02.2026 | 1.0 | Первая версия документа |

---

**Документ создан для оптимизации рабочего процесса**
*Katya ❤️ Claude - работаем вместе над "Город Спорта"*
