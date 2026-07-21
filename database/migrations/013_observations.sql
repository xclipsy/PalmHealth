-- 013_observations.sql
-- Clinical observations written by professionals (Part 5).
-- Visible to the patient only when visible_to_patient is true.
-- Editable only by the authoring professional; never deleted physically.

CREATE TABLE IF NOT EXISTS observations (
  id                 BIGSERIAL PRIMARY KEY,
  patient_id         BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  professional_id    BIGINT NOT NULL REFERENCES professionals (id) ON DELETE RESTRICT,
  treatment_id       BIGINT REFERENCES treatments (id) ON DELETE SET NULL,
  title              VARCHAR(150) NOT NULL,
  content            TEXT NOT NULL,
  visible_to_patient BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_observations_patient_id ON observations (patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_professional_id ON observations (professional_id);
