-- 011_routines.sql
-- Routine catalog: exercise, nutrition and lifestyle (Part 7).

CREATE TABLE IF NOT EXISTS routines (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE,
  type        VARCHAR(20) NOT NULL
              CHECK (type IN ('EXERCISE', 'NUTRITION', 'LIFESTYLE')),
  description VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_routines_type ON routines (type);
