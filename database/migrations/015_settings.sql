-- 015_settings.sql
-- Per-user preferences (Part 7). One row per user (UNIQUE user_id).

CREATE TABLE IF NOT EXISTS settings (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE RESTRICT,
  language              VARCHAR(10) NOT NULL DEFAULT 'es',
  timezone              VARCHAR(50) NOT NULL DEFAULT 'America/Mexico_City',
  theme                 VARCHAR(10) NOT NULL DEFAULT 'light'
                        CHECK (theme IN ('light', 'dark')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
