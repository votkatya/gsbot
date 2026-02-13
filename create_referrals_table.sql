-- Создаем таблицу для хранения рефералов (Подарить купон другу)
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    friend_name VARCHAR(255) NOT NULL,
    friend_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
