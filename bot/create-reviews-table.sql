-- Таблица для хранения заявок на проверку отзывов (Яндекс.Карты)
-- Запустить один раз на сервере:
-- psql -h localhost -U gsadmin -d gorodsporta -f create-reviews-table.sql

CREATE TABLE IF NOT EXISTS review_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    photo_file_id TEXT NOT NULL,       -- file_id от Telegram
    photo_url TEXT NOT NULL,           -- путь для отображения: /uploads/reviews/filename.jpg
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    admin_comment TEXT,                -- комментарий при отклонении
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,
    reviewed_by TEXT                   -- имя/роль проверяющего
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_review_submissions_user_id ON review_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_submissions_status ON review_submissions(status);
CREATE INDEX IF NOT EXISTS idx_review_submissions_submitted_at ON review_submissions(submitted_at);

-- Создать папку для хранения фото (выполнить в bash на сервере):
-- mkdir -p /var/www/gorodsporta/uploads/reviews
-- chown -R www-data:www-data /var/www/gorodsporta/uploads

-- Добавить в nginx конфиг (если нужно раздавать статику через nginx):
-- location /uploads {
--     alias /var/www/gorodsporta/uploads;
-- }

SELECT 'Table review_submissions created successfully' as result;
