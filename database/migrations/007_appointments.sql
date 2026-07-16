-- 007_appointments.sql
-- Appointments between patients and professionals (Parts 4, 5, 7).
-- Professionals create/update/cancel; patients view and cancel.

CREATE TABLE IF NOT EXISTS appointments (
  id                  BIGSERIAL PRIMARY KEY,
  patient_id          BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  professional_id     BIGINT NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    SMALLINT NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 480),
  reason              VARCHAR(255) NOT NULL,
  location            VARCHAR(255),
  notes               TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
                      CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  cancellation_reason VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments (professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
