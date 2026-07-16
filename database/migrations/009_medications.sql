-- 009_medications.sql
-- Medication catalog (Part 7). Prescriptions live in patient_medications.

CREATE TABLE IF NOT EXISTS medications (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
