--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-23-add-is-system-and-user-tags

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false NOT NULL;

UPDATE categories
SET is_system = true
WHERE id BETWEEN 1 AND 102 AND user_id IS NULL;

ALTER TABLE tags
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false NOT NULL;

UPDATE tags
SET is_system = true
WHERE id BETWEEN 1 AND 10 AND user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);