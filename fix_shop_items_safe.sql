-- Безопасная очистка призов с сохранением истории покупок
-- Дата: 13.02.2026

-- Вариант 1: Если покупки - тестовые, можно удалить
-- DELETE FROM purchases WHERE item_id IN (SELECT id FROM shop_items WHERE is_active = false);
-- DELETE FROM shop_items WHERE is_active = false;

-- Вариант 2: Оставляем старые призы, но показываем только новые (безопасно)
-- API уже фильтрует по is_active = true, поэтому старые не видны в приложении

-- Просто проверяем, что новые призы видны
SELECT id, title, price, is_active 
FROM shop_items 
WHERE is_active = true 
ORDER BY price;
