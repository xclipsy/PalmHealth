// Punto de entrada del servidor API REST Palm Health.
const app = require('./app');
const { env } = require('./config/env.config');
const { closePool } = require('./config/database.config');

const server = app.listen(env.port, () => {
  console.log(`[palm-health-api] Servidor ejecutándose en el puerto ${env.port} (${env.nodeEnv})`);
});

// Apagado controlado del servidor.
const shutdown = (signal) => {
  console.log(`[palm-health-api] Señal ${signal} recibida, cerrando conexiones...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
