--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-11-create-indexes

CREATE INDEX idx_accounts_user_id           ON accounts(user_id);

CREATE INDEX idx_categories_parent_id       ON categories(parent_id);
CREATE INDEX idx_categories_user_id         ON categories(user_id);

CREATE INDEX idx_operations_account_id      ON operations(account_id);
CREATE INDEX idx_operations_category_id     ON operations(category_id);
CREATE INDEX idx_operations_date_time       ON operations(date_time DESC);
CREATE INDEX idx_operations_transfer_id     ON operations(transfer_id);