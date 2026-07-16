-- 010_patient_medications.sql
-- Prescriptions: medication assigned to a patient with dosage and
-- schedule (Parts 4, 5, 7). History always preserved (soft delete,
-- status transitions — never physical removal).

CREATE TABLE IF NOT EXISTS patient_medications (
  id              BIGSERIAL PRIMARY KEY,
  patient_id      BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  medication_id   BIGINT NOT NULL REFERENCES medications (id) ON DELETE RESTRICT,
  professional_id BIGINT NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  treatment_id    BIGINT REFERENCES treatments (id) ON DELETE SET NULL,
  dosage          VARCHAR(100) NOT NULL,
  frequency       VARCHAR(100) NOT NULL,
  instructions    TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_patient_medication_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id ON patient_medications (patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_professional_id ON patient_medications (professional_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_status ON patient_medications (status);
