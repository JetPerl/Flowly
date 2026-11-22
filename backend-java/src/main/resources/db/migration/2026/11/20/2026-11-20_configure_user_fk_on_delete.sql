--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-20-configure-user-fk-on-delete

ALTER TABLE logs
DROP CONSTRAINT IF EXISTS logs_user_id_fkey,
    ADD CONSTRAINT logs_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE accounts
DROP CONSTRAINT IF EXISTS accounts_user_id_fkey,
    ADD CONSTRAINT accounts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_user_id_fkey,
    ADD CONSTRAINT categories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey,
    ADD CONSTRAINT user_sessions_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;