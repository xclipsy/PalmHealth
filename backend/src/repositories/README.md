# Repositories

Data access layer: the only layer allowed to execute SQL, always through parameterized queries via `src/config/database.config.js`. **No HTTP knowledge and no business rules here.** Every read query filters out soft-deleted rows (`deleted_at IS NULL`) automatically.

Implemented:

- `base.repository.js` — shared foundation: parameterized query execution, `findById`, `count` and `softDelete` with the `deleted_at IS NULL` convention. Every entity repository extends this class.

Planned files (one per entity, implemented from Module 4 onward):

- `user.repository.js`
- `patient.repository.js`
- `professional.repository.js`
- `assignment.repository.js`
- `appointment.repository.js`
- `symptom.repository.js`
- `observation.repository.js`
- `treatment.repository.js`
- `medication.repository.js`
- `routine.repository.js`
- `notification.repository.js`
- `settings.repository.js`

Naming convention: `entity.repository.js`. Raw SQL only — ORMs are prohibited by the specification.
