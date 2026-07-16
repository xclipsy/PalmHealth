-- =============================================================
-- Migration 002: patients
-- 1:1 extension of users for the PATIENT role (3NF: role-specific
-- attributes live in their own table, not in users).
-- =============================================================

CREATE TABLE IF NOT EXISTS patients (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT       NOT NULL,
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    birth_date              DATE         NOT NULL,
    phone                   VARCHAR(30)  NOT NULL,
    gender                  VARCHAR(20),
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(30),
    photo_url               VARCHAR(500),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ,

    CONSTRAINT patients_user_unique UNIQUE (user_id),
    CONSTRAINT patients_user_fk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients (user_id);
