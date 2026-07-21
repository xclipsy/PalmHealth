/**
 * Punto de entrada del servidor.
 *
 * Responsabilidad: solo inicialización. Carga la configuración del
 * entorno, importa la aplicación Express configurada e inicia la escucha.
 *
 * Toda la configuración de Express vive en app.js (separación de
 * responsabilidades: app.js puede ser importado por pruebas sin abrir
 * un puerto de red).
 */

const app = require('./app');
const { env } = require('./config/env.config');
const { closePool } = require('./config/database.config');

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[palm-health-api] Server running on port ${env.port} (${env.nodeEnv})`);
});

/**
 * Apagado controlado: cierra el servidor HTTP y el pool de PostgreSQL
 * al recibir señales de terminación, permitiendo que las solicitudes
 * en curso finalicen y evitando fugas de conexiones a la base de datos
 * antes de que el proceso termine.
 *
 * @param {string} signal - Nombre de la señal del proceso recibida.
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
