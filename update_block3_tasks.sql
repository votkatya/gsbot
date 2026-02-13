-- Обновляем задания блока 3 (Заминка)

-- Задание 11: Оставь отзыв на Яндекс Картах
UPDATE tasks SET
    title = 'Оставь отзыв',
    description = 'Оставь отзыв на Яндекс Картах',
    coins_reward = 50,
    verification_type = 'none',
    verification_data = jsonb_build_object(
        'url', 'https://yandex.ru/maps/org/gorod_sporta/209299430564/reviews/?add-review=true&ll=54.015222%2C57.071177&z=16'
    )
WHERE day_number = 11;

-- Задание 12: Удаляем "Расскажи о нас" (деактивируем)
UPDATE tasks SET
    title = '[УДАЛЕНО] Расскажи о нас',
    description = 'Это задание больше не активно',
    coins_reward = 0,
    verification_type = 'none'
WHERE day_number = 12;

-- Задание 13: Подарить купон другу
UPDATE tasks SET
    title = 'Подарить купон другу',
    description = 'Заполни форму и мы отправим твоему другу купон на бесплатное посещение Города Спорта!',
    coins_reward = 100,
    verification_type = 'referral_form',
    verification_data = jsonb_build_object(
        'fields', jsonb_build_array('friend_name', 'friend_phone')
    )
WHERE day_number = 13;

-- Задание 14: Пройди тест
UPDATE tasks SET
    title = 'Пройди тест',
    description = 'Ты уже свой в нашем клубе? Пройди финальный тест!',
    coins_reward = 50,
    verification_type = 'quiz',
    verification_data = jsonb_build_object(
        'questions', jsonb_build_array(
            jsonb_build_object(
                'question', 'Сколько у нас тренажёров в зале?',
                'answers', jsonb_build_array(
                    jsonb_build_object('text', '88 - всегда есть, что попробовать нового', 'correct', true),
                    jsonb_build_object('text', '67 и каждый ждет тебя!', 'correct', false)
                )
            ),
            jsonb_build_object(
                'question', 'Что входит в клубную карту (приятный бонус)?',
                'answers', jsonb_build_array(
                    jsonb_build_object('text', 'Бесплатная персональная тренировка с тренером (в бассейне или тренажёрном зале)', 'correct', true),
                    jsonb_build_object('text', 'Право один раз сказать "я с понедельника начну" без осуждения', 'correct', false)
                )
            ),
            jsonb_build_object(
                'question', 'В бассейне у нас',
                'answers', jsonb_build_array(
                    jsonb_build_object('text', '6 дорожек по 25 м - чтобы плавать красиво и уверенно', 'correct', true),
                    jsonb_build_object('text', '4 дорожки по 150 м - чтобы один раз поплыл и сразу заслужил уважение', 'correct', false)
                )
            )
        )
    )
WHERE day_number = 14;
