-- Миграция: добавление поддержки VK Mini App
-- Дата: 2026-03-01

-- 1. Делаем telegram_id необязательным (VK-пользователи не имеют telegram_id)
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;

-- 2. Добавляем vk_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS vk_id BIGINT UNIQUE;

-- 3. Проверка результата
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('telegram_id', 'vk_id')
ORDER BY column_name;
