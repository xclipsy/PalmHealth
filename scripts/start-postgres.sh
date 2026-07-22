#!/usr/bin/env bash
# Inicia el servidor local de PostgreSQL y garantiza la creación de la base de datos 'palm_health'.
set -e

PGDATA_DIR="${PGDATA_DIR:-/var/lib/postgresql/data}"
PGLOG_FILE="${PGLOG_FILE:-/var/log/postgresql/postgres.log}"

if pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -q 2>/dev/null; then
  echo "PostgreSQL ya se encuentra en ejecución."
  exit 0
fi

mkdir -p "$(dirname "$PGLOG_FILE")"

echo "Iniciando servidor de PostgreSQL..."
pg_ctl -D "$PGDATA_DIR" -l "$PGLOG_FILE" -o "-p 5432 -k /tmp" start

# Crea la base de datos si no existe.
psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -tc "SELECT 1 FROM pg_database WHERE datname = 'palm_health'" | grep -q 1 \
  || psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -c "CREATE DATABASE palm_health;"

echo "PostgreSQL listo en ${DB_HOST:-localhost}:5432 (base de datos: palm_health)."
