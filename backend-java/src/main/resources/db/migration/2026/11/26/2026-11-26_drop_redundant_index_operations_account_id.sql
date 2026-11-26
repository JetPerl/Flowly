--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-26-drop-redundant-index-operations-account-id

DROP INDEX IF EXISTS idx_operations_account_id;