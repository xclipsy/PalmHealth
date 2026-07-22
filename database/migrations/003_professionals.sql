-- =============================================================
-- Migration 003: professionals
-- 1:1 extension of users for the PROFESSIONAL role. The medical
-- license number is unique across the platform (Part 3).
-- =============================================================

CREATE TABLE IF NOT EXISTS professionals (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL,
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    license_number   VARCHAR(50)  NOT NULL,
    specialty        VARCHAR(100) NOT NULL,
    phone            VARCHAR(30)  NOT NULL,
    years_experience INTEGER,
    clinic_name      VARCHAR(200),
    photo_url        VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,

    CONSTRAINT professionals_user_unique    UNIQUE (user_id),
    CONSTRAINT professionals_license_unique UNIQUE (license_number),
    CONSTRAINT professionals_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT professionals_experience_check
        CHECK (years_experience IS NULL OR years_experience >= 0)
);

CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals (user_id);
