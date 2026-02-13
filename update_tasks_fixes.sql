-- Правки заданий: обновление карточки "Давай дружить" и добавление тестовых кодов

-- 1. Обновить день 2 "Давай дружить" - заменить Telegram на ВК
UPDATE tasks
SET
    title = 'Давай дружить',
    description = 'Подпишись на нашу группу ВКонтакте https://vk.com/gorodsporta18

Напиши в сообщения сообщества слово "Игра", получи код и введи в поле ниже',
    verification_type = 'app_code',
    verification_data = jsonb_build_object('test_code', 'testgs')
WHERE day_number = 2;

-- 2. Добавить тестовый код "testgs" для дня 3 (если есть ручной ввод)
UPDATE tasks
SET
    verification_data = COALESCE(verification_data, '{}'::jsonb) || jsonb_build_object('test_code', 'testgs')
WHERE day_number = 3 AND verification_type = 'app_code';

-- 3. Добавить тестовый код "testgs" для дней 4-9 (QR или ручной код)
UPDATE tasks
SET
    verification_data = verification_data || jsonb_build_object('test_code', 'testgs')
WHERE day_number IN (4, 5, 6, 7, 8, 9) AND verification_type = 'qr_or_manual';

-- 4. Вернуть карточку "Анкета итоговая" в блок Заминка (если ее нет)
-- Сначала проверим, есть ли уже задание с day_number = 11
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tasks WHERE day_number = 11) THEN
        INSERT INTO tasks (day_number, title, description, coins_reward, verification_type, verification_data)
        VALUES (
            11,
            'Анкета итоговая',
            'Расскажи нам о своих впечатлениях от игры!

Ответь на несколько вопросов о том, что тебе понравилось, что можно улучшить, и какие подарки ты хотел бы получить.',
            50,
            'survey',
            jsonb_build_object(
                'survey_type', 'final',
                'questions', jsonb_build_array(
                    jsonb_build_object(
                        'id', 1,
                        'type', 'rating',
                        'question', 'Оцени игру от 1 до 5',
                        'required', true
                    ),
                    jsonb_build_object(
                        'id', 2,
                        'type', 'text',
                        'question', 'Что тебе понравилось больше всего?',
                        'required', false
                    ),
                    jsonb_build_object(
                        'id', 3,
                        'type', 'text',
                        'question', 'Что можно улучшить?',
                        'required', false
                    ),
                    jsonb_build_object(
                        'id', 4,
                        'type', 'text',
                        'question', 'Какие подарки ты хотел бы получить?',
                        'required', false
                    )
                )
            )
        );
    END IF;
END $$;

-- 5. Проверить результат
SELECT day_number, title, verification_type, verification_data FROM tasks ORDER BY day_number;
