-- Обновление заданий блока 2 (дни 3-10) с QR-кодами и ручными кодами

-- День 3
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY3',
        'manual_code', 'WRM12'
    )
WHERE day_number = 3;

-- День 4
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY4',
        'manual_code', 'CRD23'
    )
WHERE day_number = 4;

-- День 5
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY5',
        'manual_code', 'PWR34'
    )
WHERE day_number = 5;

-- День 6
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY6',
        'manual_code', 'FLX45'
    )
WHERE day_number = 6;

-- День 7
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY7',
        'manual_code', 'END56'
    )
WHERE day_number = 7;

-- День 8
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY8',
        'manual_code', 'STR67'
    )
WHERE day_number = 8;

-- День 9
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY9',
        'manual_code', 'SPD78'
    )
WHERE day_number = 9;

-- День 10
UPDATE tasks
SET
    verification_type = 'qr_or_manual',
    verification_data = jsonb_build_object(
        'qr_code', 'GORODSPORTA_DAY10',
        'manual_code', 'FNL89'
    )
WHERE day_number = 10;
