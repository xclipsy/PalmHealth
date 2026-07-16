#!/usr/bin/env bash
# Starts the local PostgreSQL server if it is not already running.
# Used in the sandbox/dev environment before launching the backend.

set -e

PGDATA_DIR="${PGDATA_DIR:-/vercel/share/pgdata}"
PGLOG_FILE="${PGLOG_FILE:-/vercel/share/pglog/postgres.log}"

if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
  echo "PostgreSQL is already running."
  exit 0
fi

mkdir -p "$(dirname "$PGLOG_FILE")"

echo "Starting local PostgreSQL server..."
pg_ctl -D "$PGDATA_DIR" -l "$PGLOG_FILE" -o "-p 5432 -k /tmp" start

# Ensure the application database exists.
psql -h localhost -p 5432 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'palm_health'" | grep -q 1 \
  || psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE palm_health;"

echo "PostgreSQL ready on localhost:5432 (database: palm_health)."
