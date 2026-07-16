-- 005_symptom_categories.sql
-- Catalog of symptom categories (Part 7). Referenced by symptoms.

CREATE TABLE IF NOT EXISTS symptom_categories (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);
