# Palm Health — Backend

Express.js REST API following strict layered MVC.

## Request Flow

```
Router -> Middlewares -> Validators -> Controller -> Service -> Repository -> PostgreSQL
```

Hard rules:

- **Controllers**: HTTP only. No business logic, no SQL.
- **Services**: business rules and ownership checks. No HTTP objects, no SQL.
- **Repositories**: the only layer executing SQL (parameterized, via `pg`). No HTTP knowledge.
- Dependencies flow one way — never inverted, never circular.

## Structure

```
src/
├── app.js              # Express configuration (middlewares, routes, error handling)
├── server.js           # Bootstrap only (loads app.js and listens)
├── config/             # env.config.js, database.config.js
├── routes/             # index.js + one route file per domain
├── middlewares/        # auth, error handling
├── validators/         # express-validator chains per route
├── controllers/        # HTTP layer (Modules 4, 8, 9)
├── services/           # business logic (Modules 4, 8, 9)
├── repositories/       # data access, raw SQL (Module 3+)
├── errors/             # reusable AppError classes
├── constants/          # domain constants (roles, statuses, pagination)
└── utils/              # response helpers, shared utilities
```

## Response Format

```json
{ "success": true,  "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

Errors never expose stack traces, SQL or internal paths. Correct HTTP status codes always (never 200 on failure).

## Scripts

```bash
pnpm dev     # nodemon src/server.js
pnpm start   # node src/server.js
```
