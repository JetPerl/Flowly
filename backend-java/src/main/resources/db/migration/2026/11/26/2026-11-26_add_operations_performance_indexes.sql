--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-26-add-operations-performance-indexes

CREATE INDEX IF NOT EXISTS idx_operations_account_date_id
    ON operations (account_id, date_time DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_operations_transfer_id_not_null
    ON operations (transfer_id)
    WHERE transfer_id IS NOT NULL;