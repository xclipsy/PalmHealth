#!/usr/bin/env bash
# =============================================================
# Applies every SQL migration in database/migrations in filename
# order (001_, 002_, ...) against the local palm_health database.
# Idempotent: every migration uses IF NOT EXISTS guards.
# =============================================================
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-palm_health}"
DB_USER="${DB_USER:-postgres}"

MIGRATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/database/migrations"

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || { echo "No migrations found."; exit 0; }
  echo "Applying $(basename "$file")..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$file"
done

echo "All migrations applied."
