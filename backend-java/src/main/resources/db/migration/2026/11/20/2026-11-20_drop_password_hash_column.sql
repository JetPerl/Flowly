--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-20-drop-password-hash-column

ALTER TABLE users
    DROP COLUMN IF EXISTS password_hash;