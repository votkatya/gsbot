-- Обновление заданий блока 2 (дни 4-9) с QR-кодами и ручными кодами

-- День 4: Пройди Таниту (Медкабинет)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY4',
        'manual_code', 'TNT45'
    )
WHERE day_number = 4;

-- День 5: Вводная тренировка (Тренажерный зал)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY5',
        'manual_code', 'GYM56'
    )
WHERE day_number = 5;

-- День 6: Полежать в джакузи (Бассейн)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY6',
        'manual_code', 'SPA67'
    )
WHERE day_number = 6;

-- День 7: Посети коммерческий класс (Групповые)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY7',
        'manual_code', 'GRP78'
    )
WHERE day_number = 7;

-- День 8: Вводная тренировка в бассейне (Бассейн)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY8',
        'manual_code', 'PWL89'
    )
WHERE day_number = 8;

-- День 9: Посети мероприятие (Клуб)
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY9',
        'manual_code', 'EVT90'
    )
WHERE day_number = 9;
