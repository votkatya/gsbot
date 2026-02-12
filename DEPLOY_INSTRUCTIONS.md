# Инструкция по деплою приложения Город Спорта

## Проблема
Приложение зависает на бесконечной загрузке в Telegram Mini App из-за того, что **backend API на Timeweb не запущен или недоступен**.

## Что было исправлено

### 1. Добавлены таймауты для API запросов
- Теперь запросы к API завершаются через 10 секунд вместо бесконечного ожидания
- Файл: `webapp-react/src/services/api.ts`

### 2. Улучшена обработка ошибок
- Все API функции теперь имеют try-catch блоки
- Пользователю показывается понятное сообщение об ошибке

### 3. Добавлен UI для отображения ошибки сервера
- Если сервер недоступен, показывается экран с сообщением и кнопкой "Попробовать снова"
- Файл: `webapp-react/src/pages/Index.tsx`

## Шаги для исправления на Timeweb

### Шаг 1: Проверить статус backend сервера

Зайдите в панель Timeweb и проверьте:

1. **Node.js приложение запущено?**
   - Должен быть запущен файл `bot/index.js`
   - Порт: 3000
   - Домен: `https://gsbot18.ru`

2. **PostgreSQL база данных доступна?**
   - Host: localhost
   - Port: 5432
   - Database: gorodsporta
   - User: gsadmin

3. **SSL сертификат настроен?**
   - Для домена `gsbot18.ru` должен быть валидный SSL сертификат

### Шаг 2: Запустить backend на Timeweb

Если сервер не запущен:

```bash
# SSH в сервер Timeweb
cd /path/to/project/bot
npm install
node index.js
```

Или настроить автозапуск через PM2:

```bash
pm2 start index.js --name "gorodsporta-bot"
pm2 save
pm2 startup
```

### Шаг 3: Проверить доступность API

Проверьте что API отвечает:

```bash
curl https://gsbot18.ru/api/leaderboard
```

Должен вернуться JSON с данными (или пустой массив).

### Шаг 4: Загрузить frontend на Timeweb

Загрузите содержимое папки `deploy/` на сервер Timeweb:

1. **Через FTP/SFTP:**
   - Подключитесь к серверу
   - Скопируйте все файлы из `deploy/` в корневую папку веб-сервера
   - Обычно это `/var/www/html/` или `/home/user/public_html/`

2. **Через rsync (если есть SSH доступ):**
   ```bash
   rsync -avz deploy/ user@gsbot18.ru:/var/www/html/
   ```

3. **Через Git (рекомендуется):**
   ```bash
   # На сервере
   cd /var/www/html/
   git pull origin main
   # Файлы из deploy/ должны быть закоммичены в репозиторий
   ```

### Шаг 5: Настроить Nginx (если используется)

Если на Timeweb используется Nginx, убедитесь что настроен правильный proxy:

```nginx
server {
    listen 443 ssl;
    server_name gsbot18.ru;

    # SSL сертификаты
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Static files (frontend)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Node.js
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Webhook для бота
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

После изменения конфига:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Проверка работоспособности

### 1. Проверить backend API
```bash
curl https://gsbot18.ru/
# Должно вернуть: "Bot is running"

curl https://gsbot18.ru/api/leaderboard
# Должен вернуть JSON массив
```

### 2. Проверить frontend
Откройте в браузере: `https://gsbot18.ru`
- Должна загрузиться страница приложения
- Если API недоступен, покажется экран с ошибкой и кнопкой "Попробовать снова"

### 3. Проверить в Telegram
Откройте Mini App через бота:
- Должны загрузиться задания
- Или показаться понятное сообщение об ошибке

## Логи для диагностики

### Backend логи (Node.js):
```bash
pm2 logs gorodsporta-bot
# или
journalctl -u gorodsporta-bot -f
```

### Nginx логи:
```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### PostgreSQL логи:
```bash
tail -f /var/log/postgresql/postgresql-*.log
```

## Дополнительно

### Если нужно использовать mock API для тестирования

В файле `webapp-react/.env` можно временно включить mock режим:

```env
VITE_API_BASE_URL=https://gsbot18.ru
VITE_USE_MOCK_API=true
```

Пересобрать:
```bash
cd webapp-react
npm run build
cp -r dist/* ../deploy/
```

## Контакты базы данных (НЕ КОММИТИТЬ В GIT)

Эти данные есть в `bot/index.js` строки 8-14. **Уберите их из кода** и используйте переменные окружения:

```javascript
// bot/index.js
const pool = new Pool({
    user: process.env.DB_USER || "gsadmin",
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "gorodsporta"
});
```

Создайте файл `.env` в папке `bot/`:
```env
DB_USER=gsadmin
DB_PASSWORD=GorodSporta2025!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gorodsporta
```

И не забудьте добавить `.env` в `.gitignore`!

## Что дальше?

После того как backend заработает:
1. Приложение перестанет зависать
2. Пользователи увидят либо данные, либо понятное сообщение об ошибке
3. Можно будет работать с заданиями, магазином и рейтингом
