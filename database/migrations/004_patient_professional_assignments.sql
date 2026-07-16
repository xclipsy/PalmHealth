-- =============================================================
-- Migration 004: patient_professional_assignments
-- Links patients to the professionals in charge of them. This is
-- the source of truth for ownership authorization: a professional
-- may only access data of patients with an ACTIVE assignment here.
-- Designed to support multiple professionals per patient (Part 7).
-- =============================================================

CREATE TABLE IF NOT EXISTS patient_professional_assignments (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT      NOT NULL,
    professional_id BIGINT      NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,

    CONSTRAINT assignments_patient_fk FOREIGN KEY (patient_id)
        REFERENCES patients (id) ON DELETE RESTRICT,
    CONSTRAINT assignments_professional_fk FOREIGN KEY (professional_id)
        REFERENCES professionals (id) ON DELETE RESTRICT,
    CONSTRAINT assignments_status_check
        CHECK (status IN ('ACTIVE', 'COMPLETED', 'INACTIVE')),
    CONSTRAINT assignments_pair_unique UNIQUE (patient_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_patient_id      ON patient_professional_assignments (patient_id);
CREATE INDEX IF NOT EXISTS idx_assignments_professional_id ON patient_professional_assignments (professional_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status          ON patient_professional_assignments (status);
