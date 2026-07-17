/**
 * Express application configuration.
 *
 * Responsibility: assemble the middleware pipeline, mount API routes,
 * serve the SPA frontend and register error handling. No business logic
 * lives here — that belongs to services (see /src/services).
 *
 * Request flow (Part 6 of the specification):
 *   Router -> Middlewares -> Validators -> Controller -> Service -> Repository -> PostgreSQL
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const { env } = require('./config/env.config');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

/* ------------------------------------------------------------------ */
/* Security and utility middlewares                                    */
/* ------------------------------------------------------------------ */

// Helmet sets security-related HTTP headers.
// contentSecurityPolicy is kept permissive for the MVP because the SPA
// loads Google Fonts and inline Tailwind-generated styles.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging. 'dev' format in development, 'combined' in production.
// Morgan never logs request bodies, so no medical data reaches the logs.
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

/* ------------------------------------------------------------------ */
/* API routes                                                          */
/* ------------------------------------------------------------------ */

// Base path is /api (unversioned for the MVP, ready for /api/v1 later).
app.use('/api', apiRoutes);

/* ------------------------------------------------------------------ */
/* SPA static hosting                                                  */
/* ------------------------------------------------------------------ */

// The Vanilla JS SPA is served by this same Express server in the MVP.
// Every non-API GET request falls through to index.html so the
// client-side router (History API) can resolve the route.
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

/* ------------------------------------------------------------------ */
/* Error handling (must be registered last)                            */
/* ------------------------------------------------------------------ */

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
