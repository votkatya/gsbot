# Деплой регистрации и онбординга

## Что изменилось:

1. **RegistrationModal** - форма регистрации (имя, телефон, абонемент)
2. **OnboardingModal** - 3 слайда онбординга
3. **Backend** - новый endpoint `/api/register`
4. **База данных** - поля `phone` и `membership_type`
5. **Админ-панель** - отображение телефона и абонемента

## Шаги для деплоя на сервере gsbot18.ru:

### 1. Подключиться к серверу
```bash
ssh root@gsbot18.ru
```

### 2. Перейти в директорию проекта
```bash
cd /var/www/gorodsporta
```

### 3. Обновить код из GitHub
```bash
git pull origin main
```

### 4. Добавить поля в базу данных
```bash
sudo -u postgres psql -d gorodsporta << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50);
\q
EOF
```

Или если psql требует пароль:
```bash
psql -U gsadmin -d gorodsporta << 'EOF'
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50);
\q
EOF
```

### 5. Собрать новую версию webapp-react
```bash
cd /var/www/gorodsporta/webapp-react
npm install  # на случай если есть новые зависимости
npm run build
```

### 6. Скопировать собранные файлы в deploy
```bash
cd /var/www/gorodsporta
cp -r webapp-react/dist/* deploy/
```

### 7. Собрать webapp-admin
```bash
cd /var/www/gorodsporta/webapp-admin
npm install
npm run build
```

### 8. Скопировать админку в deploy-admin
```bash
cd /var/www/gorodsporta
cp -r webapp-admin/dist/* deploy-admin/
```

### 9. Перезапустить бота (backend)
```bash
cd /var/www/gorodsporta/bot
pm2 delete gorodsporta-bot
pm2 start index.js --name gorodsporta-bot
pm2 save
```

### 10. Проверить логи
```bash
pm2 logs gorodsporta-bot --lines 50
```

### 11. Перезагрузить nginx
```bash
nginx -t && systemctl reload nginx
```

## Проверка работы:

### 1. Удалить себя из базы для тестирования регистрации:
```bash
psql -U gsadmin -d gorodsporta -c "DELETE FROM users WHERE telegram_id = 433733623;"
```

### 2. Очистить кэш Telegram:
- Настройки Telegram → Данные и память → Очистить кэш → Очистить

### 3. Открыть приложение в Telegram:
- Должна появиться форма регистрации
- После регистрации — онбординг (3 слайда)
- После онбординга — основное приложение

### 4. Проверить данные в базе:
```bash
psql -U gsadmin -d gorodsporta -c "SELECT telegram_id, first_name, phone, membership_type FROM users WHERE telegram_id = 433733623;"
```

### 5. Проверить админ-панель:
Открыть https://admin.gsbot18.ru/users и проверить, что отображаются телефон и тип абонемента.

## Если что-то не работает:

### Проверить логи nginx:
```bash
tail -50 /var/log/nginx/error.log
tail -50 /var/log/nginx/access.log | grep "assets"
```

### Проверить файлы в deploy:
```bash
ls -lah /var/www/gorodsporta/deploy/
ls -la /var/www/gorodsporta/deploy/assets/
cat /var/www/gorodsporta/deploy/index.html | grep script
```

### Проверить права доступа:
```bash
chmod -R 755 /var/www/gorodsporta/deploy/
chown -R www-data:www-data /var/www/gorodsporta/deploy/
```

## Возможные проблемы:

1. **"column membership_type does not exist"** → выполните шаг 4
2. **Приложение не загружается** → проверьте файлы в deploy/ (шаг 6)
3. **Админка не показывает новые поля** → пересоберите админку (шаги 7-8)
4. **Backend не принимает регистрацию** → перезапустите бота (шаг 9)
