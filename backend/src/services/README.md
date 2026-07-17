# Services

Business logic layer: enforce domain rules, resource ownership (patients only access their own records; professionals only their assigned patients) and orchestrate repositories. **No HTTP objects (`req`/`res`) and no SQL here.** Services throw the error classes defined in `src/errors/app.errors.js`.

Planned files (implemented in Modules 4, 8 and 9):

- `auth.service.js`
- `patient.service.js`
- `professional.service.js`
- `appointment.service.js`
- `symptom.service.js`
- `treatment.service.js`
- `medication.service.js`
- `routine.service.js`
- `notification.service.js`
- `settings.service.js`

Naming convention: `domain.service.js`. Services receive plain data and return plain data — fully testable without Express.
