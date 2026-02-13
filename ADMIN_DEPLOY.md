# Деплой админ-панели

## Шаг 1: Подключиться к серверу

```bash
ssh root@188.225.33.56
cd /root/gsbot
```

## Шаг 2: Обновить код

```bash
git pull origin main
```

## Шаг 3: Перезапустить backend (чтобы подхватить новые API endpoints)

```bash
cd /root/gsbot/bot
npm install  # на случай если добавили новые зависимости
pm2 restart gorodsporta-bot
pm2 logs gorodsporta-bot --lines 20
```

## Шаг 4: Настроить Nginx для админ-панели

Создать/обновить конфигурацию Nginx:

```bash
nano /etc/nginx/sites-available/gsbot18.ru
```

Добавить блок для админки в существующий `server` блок:

```nginx
server {
    listen 443 ssl http2;
    server_name gsbot18.ru;

    ssl_certificate /etc/letsencrypt/live/gsbot18.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gsbot18.ru/privkey.pem;

    # Основное приложение (Mini App)
    location / {
        root /root/gsbot/deploy;
        try_files $uri $uri/ /index.html;
    }

    # Админ-панель
    location /admin {
        alias /root/gsbot/deploy-admin;
        try_files $uri $uri/ /admin/index.html;
    }

    location /admin/ {
        alias /root/gsbot/deploy-admin/;
        try_files $uri $uri/ /admin/index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /admin/api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Шаг 5: Проверить и перезагрузить Nginx

```bash
nginx -t
systemctl reload nginx
```

## Шаг 6: Проверить работу админки

Открыть в браузере: https://gsbot18.ru/admin/

Пароль для входа: `GorodSporta2025Admin!`

## Важные замечания

1. **Безопасность**: Пароль захардкожен в `bot/index.js` (переменная `ADMIN_PASSWORD`). После деплоя обязательно поменяйте его!

2. **HTTPS**: Админка должна работать только по HTTPS (SSL уже настроен через Let's Encrypt)

3. **API endpoints**: Все админские API эндпоинты требуют авторизацию через header `Authorization: Bearer <token>`

4. **Локальная сборка**: Админка собирается локально и деплоится через Git (как и основное приложение)

## Обновление админки в будущем

Когда нужно обновить админку:

1. Локально внести изменения в `webapp-admin/`
2. Собрать: `cd webapp-admin && npm run build`
3. Закоммитить: `git add deploy-admin/ webapp-admin/ && git commit -m "Update admin panel"`
4. Запушить: `git push origin main`
5. На сервере: `cd /root/gsbot && git pull origin main && systemctl reload nginx`

## Структура проекта

```
/root/gsbot/
├── bot/                    # Backend (Node.js + Express)
│   └── index.js           # API endpoints для админки
├── webapp-admin/          # Исходники админки (React)
│   ├── src/
│   │   ├── pages/         # Страницы админки
│   │   ├── components/    # Компоненты
│   │   └── lib/           # API клиент
│   └── package.json
└── deploy-admin/          # Собранная админка (деплоится на сервер)
    ├── index.html
    └── assets/
```
