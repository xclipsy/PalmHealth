#!/usr/bin/env bash
# Aplica las migraciones SQL en database/migrations y los catálogos base en orden secuencial.
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-palm_health}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-postgrespassword}"

MIGRATIONS_DIR="$(cd "$(dirname "$0")/.." && pwd)/database/migrations"

# 1. Aplica las tablas de la base de datos
for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || { echo "No se encontraron migraciones."; exit 0; }
  echo "Aplicando $(basename "$file")..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$file"
done

# 2. Aplica los catálogos de datos iniciales
SEED_FILE="$(cd "$(dirname "$0")/.." && pwd)/database/seeds/001_catalogs.sql"
if [ -f "$SEED_FILE" ]; then
  echo "Cargando catálogos de datos iniciales..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$SEED_FILE"
fi

echo "Migraciones y catálogos aplicados con éxito."
