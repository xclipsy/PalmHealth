# Services

API communication layer. All HTTP goes through a centralized `ApiClient` (JWT injection, base URL, headers, JSON parsing, timeouts, error normalization). Components and views never call `fetch` directly.

Planned files (implemented from Module 6 onward):

- `api-client.js` (core HTTP wrapper)
- `auth.service.js`
- `patient.service.js`
- `professional.service.js`
- `notification.service.js`

Naming convention: `domain.service.js`.
