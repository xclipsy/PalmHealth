-- 008_treatments.sql
-- Personalized treatments prescribed by professionals (Parts 4, 5, 7).
-- Read-only for patients. History preserved via soft delete.

CREATE TABLE IF NOT EXISTS treatments (
  id              BIGSERIAL PRIMARY KEY,
  patient_id      BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  professional_id BIGINT NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  title           VARCHAR(150) NOT NULL,
  description     TEXT NOT NULL,
  instructions    TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_treatment_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments (patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_professional_id ON treatments (professional_id);
CREATE INDEX IF NOT EXISTS idx_treatments_status ON treatments (status);
