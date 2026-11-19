--liquibase formatted SQL
--changeset Ilya_Burnas:2026-11-11-create-operations-table

CREATE TABLE operations
(
    id                  INTEGER GENERATED AS DEFAULT BY IDENTITY PRIMARY KEY,
    account_id          INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    type                VARCHAR(50) NOT NULL,
    amount              NUMERIC(19, 4) NOT NULL,
    currency            VARCHAR(10),
    date_time           TIMESTAMP WITH TIME ZONE NOT NULL,
    merchant            VARCHAR(255),
    place               VARCHAR(255),
    recipient           VARCHAR(255),
    note                TEXT,
    photo_url           TEXT,
    is_pinned           BOOLEAN DEFAULT false NOT NULL,
    related_account_id  INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    transfer_id         INTEGER,
    asset_id            INTEGER REFERENCES crypto_assets(id) ON DELETE SET NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT check_amount_positive CHECK (amount > 0)
);