#!/usr/bin/env bash
#
# Integration verification matrix for the Palm Health REST API.
# Checks every security and error-handling scenario end to end:
# auth, roles, ownership, validation, 404s and happy paths.
#
# Requires seeded demo data (scripts/seed-demo.sh).
# Usage: bash scripts/verify-api.sh [API_BASE_URL]
set -uo pipefail

API="${1:-http://localhost:3000}/api"
PASS=0
FAIL=0

check() {
  local expected="$1" actual="$2" label="$3"
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS + 1))
    printf 'PASS [%s] %s\n' "$actual" "$label"
  else
    FAIL=$((FAIL + 1))
    printf 'FAIL [%s, expected %s] %s\n' "$actual" "$expected" "$label"
  fi
}

status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

token() {
  curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" \
    | python3 -c "import json,sys;print(json.load(sys.stdin)['data']['token'])"
}

PT=$(token "ana.paciente@example.com" "Paciente123!")
DT=$(token "dr.lopez@example.com" "Doctor123!")

echo "== Authentication =="
check 200 "$(status "$API/health")" "health check"
check 401 "$(status -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"email":"ana.paciente@example.com","password":"incorrecta"}')" "login with wrong password"
check 422 "$(status -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"email":"no-es-email"}')" "login with invalid payload"
check 401 "$(status "$API/auth/profile")" "profile without token"
check 401 "$(status "$API/auth/profile" -H 'Authorization: Bearer token-invalido')" "profile with malformed token"
check 200 "$(status "$API/auth/profile" -H "Authorization: Bearer $PT")" "profile with valid token"

echo "== Role validation =="
check 403 "$(status "$API/professional/patients" -H "Authorization: Bearer $PT")" "patient blocked from professional API"
check 403 "$(status "$API/patient/dashboard" -H "Authorization: Bearer $DT")" "professional blocked from patient API"
check 200 "$(status "$API/patient/dashboard" -H "Authorization: Bearer $PT")" "patient dashboard with patient role"
check 200 "$(status "$API/professional/dashboard" -H "Authorization: Bearer $DT")" "professional dashboard with professional role"

echo "== Ownership validation =="
check 403 "$(status "$API/professional/patients/999999" -H "Authorization: Bearer $DT")" "professional blocked from unassigned patient"
check 404 "$(status "$API/patient/symptoms/999999" -H "Authorization: Bearer $PT")" "patient blocked from foreign symptom"
check 404 "$(status -X PUT "$API/professional/treatments/999999" -H "Authorization: Bearer $DT" -H 'Content-Type: application/json' -d '{"title":"Título válido","description":"Descripción válida"}')" "update on foreign treatment"

echo "== Validation errors (Spanish messages) =="
check 422 "$(status -X POST "$API/patient/symptoms" -H "Authorization: Bearer $PT" -H 'Content-Type: application/json' -d '{"intensity":99}')" "symptom with invalid intensity"
check 422 "$(status -X POST "$API/professional/appointments" -H "Authorization: Bearer $DT" -H 'Content-Type: application/json' -d '{}')" "appointment without required fields"
check 422 "$(status -X POST "$API/professional/treatments" -H "Authorization: Bearer $DT" -H 'Content-Type: application/json' -d '{"patientId":"1","title":"Sin descripción"}')" "treatment without description"

echo "== Not found and method handling =="
check 404 "$(status "$API/ruta-inexistente")" "unknown API route"
check 404 "$(status "$API/patient/appointments/999999" -H "Authorization: Bearer $PT")" "nonexistent appointment"

echo "== Happy paths (CRUD sample) =="
check 200 "$(status "$API/patient/symptoms" -H "Authorization: Bearer $PT")" "patient symptom list"
check 200 "$(status "$API/patient/notifications" -H "Authorization: Bearer $PT")" "patient notifications"
check 200 "$(status "$API/professional/patients" -H "Authorization: Bearer $DT")" "professional patient directory"
check 200 "$(status "$API/professional/calendar" -H "Authorization: Bearer $DT")" "professional calendar"
check 200 "$(status "$API/professional/routines/catalog" -H "Authorization: Bearer $DT")" "routine catalog"
check 201 "$(status -X POST "$API/patient/symptoms" -H "Authorization: Bearer $PT" -H 'Content-Type: application/json' -d '{"categoryId":2,"intensity":3,"description":"Dolor de cabeza leve verificación"}')" "symptom creation"

echo
echo "Result: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
