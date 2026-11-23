--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-20-configure-operations-fk-on-delete

ALTER TABLE operations
DROP CONSTRAINT IF EXISTS operations_account_id_fkey,
    ADD CONSTRAINT operations_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE operations
DROP CONSTRAINT IF EXISTS operations_related_account_id_fkey,
    ADD CONSTRAINT operations_related_account_id_fkey
        FOREIGN KEY (related_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE operations
DROP CONSTRAINT IF EXISTS operations_category_id_fkey,
    ADD CONSTRAINT operations_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE operation_tags
DROP CONSTRAINT IF EXISTS operation_tags_operation_id_fkey,
    ADD CONSTRAINT operation_tags_operation_id_fkey
        FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE;

ALTER TABLE crypto_assets
DROP CONSTRAINT IF EXISTS crypto_assets_account_id_fkey,
    ADD CONSTRAINT crypto_assets_account_id_fkey
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE budgets
DROP CONSTRAINT IF EXISTS budgets_category_id_fkey,
    ADD CONSTRAINT budgets_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;