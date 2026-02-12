-- Очистка дублирующихся призов
-- Дата: 13.02.2026

-- Удаляем все неактивные призы (старые)
DELETE FROM shop_items WHERE is_active = false;

-- Проверяем результат
SELECT id, title, price, is_active FROM shop_items ORDER BY price;
