--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-11-create-operation-tags-table

CREATE TABLE operation_tags
(
    operation_id        INTEGER NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    tag_id              INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (operation_id, tag_id)
);