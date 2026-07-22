# Palm Health — Database Documentation

PostgreSQL, third normal form (3NF), raw SQL migrations (no ORM). 15 tables, 23 foreign keys, 52 indexes.

## Entity Relationship Overview

```
users ─1:1─ patients ────────────┐
  │                              ├── patient_professional_assignments (M:N link, active flag)
users ─1:1─ professionals ───────┘
  │
  └─1:1─ settings

patients 1:N ── symptoms ── N:1 symptom_categories (catalog)
patients 1:N ── appointments ── N:1 professionals
patients 1:N ── treatments ── N:1 professionals
patients 1:N ── patient_medications ── N:1 medications (catalog), N:1 professionals
patients 1:N ── patient_routines ── N:1 routines (catalog), N:1 professionals
patients 1:N ── observations ── N:1 professionals (visible_to_patient flag)
users    1:N ── notifications
```

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Authentication identity | `email` (unique), `password_hash` (bcrypt), `role` (`PATIENT`/`PROFESSIONAL`), `privacy_accepted_at` |
| `patients` | Patient profile | `user_id` FK unique, `first_name`, `last_name`, `birth_date`, `phone` |
| `professionals` | Professional profile | `user_id` FK unique, `license_number` (unique), `specialty` |
| `patient_professional_assignments` | Care relationship | `patient_id` + `professional_id` (unique pair), `is_active`, `assigned_at` |
| `symptom_categories` | Catalog (seeded) | `name`, `description` |
| `symptoms` | Patient symptom log | `patient_id`, `category_id`, `intensity` (CHECK 1–10), `description`, `body_zone`, `occurred_at` |
| `appointments` | Scheduled visits | `patient_id`, `professional_id`, `scheduled_at`, `duration_minutes`, `status` (`SCHEDULED`/`COMPLETED`/`CANCELLED`), `reason`, `location` |
| `treatments` | Treatment plans | `patient_id`, `professional_id`, `title`, `description`, `start_date`, `end_date`, `status` |
| `medications` | Medication catalog (seeded) | `name`, `presentation`, `description` |
| `patient_medications` | Prescriptions | `patient_id`, `medication_id`, `professional_id`, `dosage`, `frequency`, `instructions`, dates, `status` |
| `routines` | Routine catalog (seeded) | `name`, `category`, `description` |
| `patient_routines` | Routine assignments | `patient_id`, `routine_id`, `professional_id`, `schedule`, dates, `status` |
| `observations` | Clinical notes | `patient_id`, `professional_id`, `title`, `content`, `visible_to_patient` |
| `notifications` | Per-user inbox | `user_id`, `type`, `title`, `body`, `read_at` |
| `settings` | Per-user preferences | `user_id` FK unique, notification/privacy flags |

All tables carry `created_at`, `updated_at` and clinical tables carry `deleted_at`.

## Constraints & Integrity

- Foreign keys on every relationship (23 total) with `ON DELETE` protection.
- `CHECK` constraints for enumerated statuses, roles and `intensity` range.
- `UNIQUE` on `users.email`, `professionals.license_number`, and the assignment pair.
- `NOT NULL` on all identity and clinical-critical columns.

## Soft Delete Strategy

Clinical rows are never physically deleted. `DELETE` endpoints set `deleted_at = NOW()`; every repository read filters `WHERE deleted_at IS NULL`. This preserves the clinical audit trail while hiding removed rows from the application.

## Indexes

52 indexes total: primary keys, unique constraints, plus explicit indexes on every FK column and frequent filters (`symptoms.occurred_at`, `appointments.scheduled_at`, `notifications.read_at`, status columns). Pagination queries always sort on indexed columns.

## Migration Order

Migrations live in `database/migrations/` and must be applied in numeric order (dependencies flow downward):

```
001_users → 002_patients → 003_professionals → 004_patient_professional_assignments
→ 005_symptom_categories → 006_symptoms → 007_appointments → 008_treatments
→ 009_medications → 010_patient_medications → 011_routines → 012_patient_routines
→ 013_observations → 014_notifications → 015_settings
```

Apply them all with:

```bash
bash scripts/run-migrations.sh
```

The script is idempotent-friendly: each migration uses `CREATE TABLE IF NOT EXISTS` / guarded DDL.

## Seed Data

- `database/seeds/001_catalogs.sql` — catalog rows required by the application: 10 symptom categories, medication catalog, routine catalog. Apply with `psql -d palm_health -f database/seeds/001_catalogs.sql`.
- `scripts/seed-demo.sh` — optional demo users and clinical data created **through the API** (so hashes, notifications and assignments are produced by real application logic). Idempotent: safely re-runnable.

## Normalization & Scalability

The schema is in 3NF: catalogs (`symptom_categories`, `medications`, `routines`) are separated from event/assignment tables, user identity is separated from role profiles, and no derived data is stored. Scaling paths: connection pooling is already in place (`pg` Pool); the schema ports unchanged to managed PostgreSQL (Neon, RDS, Aurora); partitioning candidates for high volume are `symptoms` and `notifications` (by `created_at`).
