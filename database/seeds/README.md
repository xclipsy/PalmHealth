# Seeds

Fictional development data, loaded after migrations. Never run against production data.

Implemented files:

- `001_catalogs.sql` — idempotent catalog data: 10 symptom categories, 10 medications, 9 routines (`ON CONFLICT DO NOTHING`).

Planned files (Module 10 — integration, once both dashboards exist):

- `002_users.seed.sql` (demo patients + professionals with bcrypt-hashed passwords)
- `003_assignments.seed.sql`
- `004_appointments.seed.sql`
- `005_symptoms.seed.sql`
- `006_treatments.seed.sql`
- `007_medications.seed.sql`
- `008_routines.seed.sql`
- `009_notifications.seed.sql`

Load a seed with: `psql -h localhost -U postgres -d palm_health -f database/seeds/001_catalogs.sql`.
