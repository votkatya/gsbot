-- Добавить поля для регистрации в таблицу users

-- Добавить поле для телефона
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Добавить поле для типа абонемента
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50);

-- Проверить структуру
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
