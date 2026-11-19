--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-11-insert-initial-tags

INSERT INTO tags (id, name, color, icon, sort_order, is_system, is_archived)
    VALUES
        (1, 'Подарок', '#FF69B4', '🎁', 1, false, false),
        (2, 'Работа', '#4A90E2', '💼', 2, false, false),
        (3, 'Семья', '#F5A623', '👨‍👩‍👧', 3, false, false),
        (4, 'Путешествия', '#50E3C2', '✈️', 4, false, false),
        (5, 'Учёба', '#BD10E0', '📚', 5, false, false),
        (6, 'Авто', '#7ED321', '🚗', 6, false, false),
        (7, 'Крупная покупка', '#D0021B', '💸', 7, false, false),
        (8, 'Еженедельное', '#417505', '🔁', 8, false, false),
        (9, 'Важное', '#F8E71C', '⭐', 9, false, false),
        (10, 'Повтор', '#9B9B9B', '♻️', 10, false, false)
    ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('tags', 'id'), COALESCE(MAX(id), 1)) FROM tags;