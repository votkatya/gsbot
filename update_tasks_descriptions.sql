-- Обновление описаний и кодов для заданий блока 2 "Охота в клубе"

-- Задание 4: Пройди Таниту
UPDATE tasks SET
    title = 'Tanita — твой персональный анализ тела',
    description = 'Узнай не просто вес, а реальную картину: процент жира, мышечную массу, уровень воды и метаболический возраст.

Пара минут — и ты видишь, где ты сейчас и к какому результату можешь прийти.',
    verification_type = 'qr',
    verification_data = '{"qr_code": "testgs"}'::jsonb
WHERE day_number = 4;

-- Задание 5: Вводная тренировка в тренажерном зале
UPDATE tasks SET
    title = '600 м² силы и энергии',
    description = '4 зоны. 88 премиальных тренажёров.
Никаких очередей. Никаких компромиссов.

Cardio на Matrix — максимум выносливости.
Свободные веса — строй своё тело.
Matrix & Hammer — точная прокачка мышц.
Функциональная зона — тренировки нового поколения.

Здесь не просто тренируются.
Здесь становятся сильнее.',
    verification_type = 'qr',
    verification_data = '{"qr_code": "testgs"}'::jsonb
WHERE day_number = 5;

-- Задание 6: Полежать в джакузи
UPDATE tasks SET
    title = 'Полежать в джакузи',
    description = 'Тёплая вода, гидромассаж и полное расслабление мышц.
Восстановление после тренировки начинается здесь.',
    verification_type = 'qr',
    verification_data = '{"qr_code": "testgs"}'::jsonb
WHERE day_number = 6;

-- Задание 7: Посети коммерческий класс
UPDATE tasks SET
    title = 'Посети коммерческий класс',
    description = 'Посети коммерческий класс и получи код от тренера',
    verification_type = 'code',
    verification_data = NULL
WHERE day_number = 7;

-- Задание 8: Вводная тренировка в бассейне
UPDATE tasks SET
    title = 'Бассейн 25 м — твоя дистанция к силе',
    description = '6 дорожек. Глубина 1,20–1,80 м.
Вода 28°, воздух 30° — идеальный баланс.

6-метровый LED-экран с пейзажами и подводным миром.

Без ограничений по времени.
Можно детям.
3-ступенчатая система очистки — вода чистая 24/7.

Плыви. Восстанавливайся. Заряжайся.',
    verification_type = 'qr',
    verification_data = '{"qr_code": "testgs"}'::jsonb
WHERE day_number = 8;

-- Задание 9: Посети мероприятие
UPDATE tasks SET
    title = 'Посети мероприятие',
    description = 'Посети мероприятие и получи код от тренера',
    verification_type = 'code',
    verification_data = NULL
WHERE day_number = 9;

-- Удаляем дубликат задания 10 (второе "Посети коммерческий класс")
DELETE FROM tasks WHERE day_number = 10;

-- Добавляем тестовый код для заданий с верификацией по коду
INSERT INTO staff_codes (code, task_day, usage_limit, created_by)
VALUES ('testgs', NULL, 999999, 'system')
ON CONFLICT (code) DO UPDATE SET usage_limit = 999999;
