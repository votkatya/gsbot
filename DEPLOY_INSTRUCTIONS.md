# Инструкция по деплою правок

## Что изменилось:

1. **День 2 "Давай дружить"** - заменили Telegram на ВКонтакте
2. **День 11 "Анкета итоговая"** - добавлена обратно в блок Заминка
3. **Тестовый код "testgs"** - добавлен для всех заданий с ручным вводом (дни 2-9)
4. **Backend** - обновлена логика проверки кодов

## Шаги для деплоя:

### 1. Подключиться к серверу
```bash
ssh root@gsbot18.ru
```

### 2. Выполнить SQL скрипт
```bash
cd /var/www/gorodsporta
psql -U gsadmin -d gorodsporta -f update_tasks_fixes.sql
```

### 3. Обновить код из GitHub
```bash
cd /var/www/gorodsporta
git pull origin main
```

### 4. Перезапустить backend
```bash
cd /var/www/gorodsporta/bot
pm2 delete gorodsporta-bot
pm2 start index.js --name gorodsporta-bot
pm2 logs gorodsporta-bot
```

### 5. Проверить изменения
Открой приложение и проверь:
- ✅ День 2 - описание с ВКонтакте
- ✅ День 11 - анкета итоговая появилась
- ✅ Код "testgs" работает для дней 2-9
- ✅ Оригинальные коды также работают

## Что можно проверить:

### Проверка заданий в базе:
```bash
psql -U gsadmin -d gorodsporta -c "SELECT day_number, title, verification_type FROM tasks ORDER BY day_number;"
```

### Проверка кодов для блока 2:
```bash
psql -U gsadmin -d gorodsporta -c "SELECT day_number, title, verification_data->'qr_code' as qr, verification_data->'manual_code' as manual, verification_data->'test_code' as test FROM tasks WHERE day_number BETWEEN 4 AND 9;"
```

### Проверка дня 2:
```bash
psql -U gsadmin -d gorodsporta -c "SELECT day_number, title, description, verification_data FROM tasks WHERE day_number = 2;"
```

### Проверка дня 11 (Анкета итоговая):
```bash
psql -U gsadmin -d gorodsporta -c "SELECT day_number, title, description FROM tasks WHERE day_number = 11;"
```
