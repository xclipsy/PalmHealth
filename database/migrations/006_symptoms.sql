-- 006_symptoms.sql
-- Daily symptom log registered by patients (Part 4: core MVP feature).
-- Clinical history: soft delete only, FKs RESTRICT (never cascade).

CREATE TABLE IF NOT EXISTS symptoms (
  id          BIGSERIAL PRIMARY KEY,
  patient_id  BIGINT NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  category_id BIGINT NOT NULL REFERENCES symptom_categories (id) ON DELETE RESTRICT,
  intensity   SMALLINT NOT NULL CHECK (intensity BETWEEN 1 AND 10),
  description TEXT NOT NULL,
  notes       TEXT,
  body_zone   VARCHAR(100),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_symptoms_patient_id ON symptoms (patient_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_category_id ON symptoms (category_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_occurred_at ON symptoms (occurred_at);
