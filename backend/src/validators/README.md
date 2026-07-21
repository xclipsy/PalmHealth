# Validators

Request validation layer built with `express-validator`. Every endpoint validates body, params, query and headers **before** reaching the controller. Validation failures respond with `422` and field-level errors in the standardized format.

Planned files (implemented alongside their routes in Modules 4, 8 and 9):

- `auth.validators.js` (registration per role, login, password policy: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
- `patient.validators.js`
- `professional.validators.js`
- `appointment.validators.js`
- `symptom.validators.js` (intensity 1–10, category, description)
- `treatment.validators.js`
- `medication.validators.js`
- `routine.validators.js`
- `common.validators.js` (pagination, ids, sorting)

Naming convention: `domain.validators.js`.
