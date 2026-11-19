--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-11-insert-initial-exchange_rates

INSERT INTO exchange_rates (id, currency, rate_to_usd, updated_at)
    VALUES
        (1, 'USD', 1.00000000, NOW()),
        (2, 'EUR', 1.07000000, NOW()),
        (3, 'BYN', 0.31000000, NOW()),
        (4, 'RUB', 0.01200000, NOW()),
        (5, 'BTC', 91713.00000000, NOW()),
        (6, 'ETH', 3047.00000000, NOW()),
        (7, 'TON', 1.58000000, NOW())
    ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('exchange_rates', 'id'), COALESCE(MAX(id), 1)) FROM exchange_rates;