-- 012_patient_routines.sql
-- Routine assigned to a patient by a professional (Parts 4, 5, 7).

CREATE TABLE IF NOT EXISTS patient_routines (
  id              BIGSERIAL PRIMARY KEY,
  patient_id      BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  routine_id      BIGINT NOT NULL REFERENCES routines (id) ON DELETE RESTRICT,
  professional_id BIGINT NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  treatment_id    BIGINT REFERENCES treatments (id) ON DELETE SET NULL,
  schedule        VARCHAR(150) NOT NULL,
  instructions    TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_patient_routine_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_patient_routines_patient_id ON patient_routines (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_routines_professional_id ON patient_routines (professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_routines_status ON patient_routines (status);
