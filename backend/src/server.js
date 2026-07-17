/**
 * Server entry point.
 *
 * Responsibility: bootstrap only. It loads environment configuration,
 * imports the configured Express application and starts listening.
 * All Express configuration lives in app.js (separation of concerns:
 * app.js is importable by tests without opening a network port).
 */

const app = require('./app');
const { env } = require('./config/env.config');
const { closePool } = require('./config/database.config');

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[palm-health-api] Server running on port ${env.port} (${env.nodeEnv})`);
});

/**
 * Graceful shutdown: close the HTTP server and the PostgreSQL pool on
 * termination signals so in-flight requests finish and no database
 * connections leak before the process exits.
 * @param {string} signal - The received process signal name.
 */
const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`[palm-health-api] Received ${signal}, shutting down gracefully`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
