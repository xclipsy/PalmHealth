# Migrations

Modular SQL migrations — one file per entity, executed in numeric order (Part 7 of the specification), against the local PostgreSQL installation. The schema is normalized to 3NF, uses `BIGSERIAL` primary keys, `snake_case` naming, audit columns (`created_at`, `updated_at`, `deleted_at`) and soft delete on every business table.

Run all migrations with: `bash scripts/run-migrations.sh` (from the repository root).

Implemented files (15 tables):

| File | Table | Notes |
|---|---|---|
| `001_users.sql` | `users` | Unique email, bcrypt hash, role + account status |
| `002_patients.sql` | `patients` | 1:1 with users, emergency contact |
| `003_professionals.sql` | `professionals` | 1:1 with users, unique license number |
| `004_patient_professional_assignments.sql` | `patient_professional_assignments` | Unique pair, assignment status |
| `005_symptom_categories.sql` | `symptom_categories` | Catalog |
| `006_symptoms.sql` | `symptoms` | Intensity CHECK 1–10, body zone |
| `007_appointments.sql` | `appointments` | Status SCHEDULED/COMPLETED/CANCELLED, default duration 30 min |
| `008_treatments.sql` | `treatments` | Status ACTIVE/COMPLETED/SUSPENDED |
| `009_medications.sql` | `medications` | Catalog |
| `010_patient_medications.sql` | `patient_medications` | Dosage, frequency, history preserved |
| `011_routines.sql` | `routines` | Catalog, type EXERCISE/NUTRITION/LIFESTYLE |
| `012_patient_routines.sql` | `patient_routines` | Schedule per patient |
| `013_observations.sql` | `observations` | `visible_to_patient` flag |
| `014_notifications.sql` | `notifications` | 5 types, read flag, related entity |
| `015_settings.sql` | `settings` | 1:1 with users |

Rules: foreign keys use `ON DELETE RESTRICT` or `SET NULL` (never cascade over clinical history); indexes on emails, foreign keys, appointment/symptom dates and treatment states.
