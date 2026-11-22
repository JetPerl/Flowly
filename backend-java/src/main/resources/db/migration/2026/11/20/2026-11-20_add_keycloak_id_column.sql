--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-20-add-keycloak-id-column

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(64) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_keycloak_id ON users(keycloak_id);