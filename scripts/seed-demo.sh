#!/usr/bin/env bash
#
# Seeds reproducible demo data through the public REST API so that every
# validation (bcrypt hashing, express-validator rules, ownership linking)
# runs exactly as it would in production. Idempotent: re-running against an
# already-seeded database falls back to login instead of failing.
#
# Usage: bash scripts/seed-demo.sh [API_BASE_URL]
set -euo pipefail

API="${1:-http://localhost:3000}/api"

json_field() { python3 -c "import json,sys;print(json.load(sys.stdin)['data']['$1'])"; }

register_or_login() {
  local role_path="$1" payload="$2" email="$3" password="$4"
  local response
  response=$(curl -s -X POST "$API/auth/register/$role_path" -H "Content-Type: application/json" -d "$payload")
  if ! echo "$response" | python3 -c "import json,sys;d=json.load(sys.stdin);exit(0 if d.get('success') else 1)" 2>/dev/null; then
    response=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  fi
  echo "$response" | json_field token
}

echo "Seeding demo patient..."
PATIENT_TOKEN=$(register_or_login patient '{
  "email":"ana.paciente@example.com","password":"Paciente123!","passwordConfirmation":"Paciente123!",
  "firstName":"Ana","lastName":"Prueba","birthDate":"1990-05-10","phone":"5551234567","privacyAccepted":true
}' "ana.paciente@example.com" "Paciente123!")

echo "Seeding demo professional..."
PRO_TOKEN=$(register_or_login professional '{
  "email":"dr.lopez@example.com","password":"Doctor123!","passwordConfirmation":"Doctor123!",
  "firstName":"Mario","lastName":"López","licenseNumber":"MED-12345","specialty":"Medicina interna",
  "phone":"5559876543","privacyAccepted":true
}' "dr.lopez@example.com" "Doctor123!")

echo "Linking patient to professional..."
curl -s -o /dev/null -X POST "$API/professional/patients/link" \
  -H "Authorization: Bearer $PRO_TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"ana.paciente@example.com"}'

echo "Registering a demo symptom..."
curl -s -o /dev/null -X POST "$API/patient/symptoms" \
  -H "Authorization: Bearer $PATIENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"categoryId":1,"intensity":6,"description":"Palpitaciones al subir escaleras","bodyZone":"Pecho"}'

echo "Demo data ready:"
echo "  Paciente:    ana.paciente@example.com / Paciente123!"
echo "  Profesional: dr.lopez@example.com / Doctor123!"
