# State

Custom global state manager (no external libraries). Encapsulates: current user, authentication (JWT in localStorage for the MVP), notifications, theme, global loading and error state, current route.

Planned files (implemented in Module 6):

- `store.js` (subscribe/get/set core)
- `auth.state.js` (session, login/logout, role helpers)

State is only mutated through exported actions — never directly from views or components.
