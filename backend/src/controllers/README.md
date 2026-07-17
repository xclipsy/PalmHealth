# Controllers

HTTP layer: receive the validated request, call the corresponding service and send the standardized response with `sendSuccess` (see `src/utils/response.util.js`). **No business logic and no SQL here.**

Implemented:

- `health.controller.js` — reference controller: thin, async-wrapped, responds only through `sendSuccess`. Every future controller follows this shape.

Planned files (one per domain, implemented in Modules 4, 8 and 9):

- `auth.controller.js`
- `patient.controller.js`
- `professional.controller.js`
- `appointment.controller.js`
- `symptom.controller.js`
- `treatment.controller.js`
- `medication.controller.js`
- `routine.controller.js`
- `notification.controller.js`
- `settings.controller.js`

Naming convention: `domain.controller.js`, exported functions in camelCase.
