/**
 * Controlador de salud.
 *
 * Implementación de referencia de la capa de controladores:
 * ligera, sin lógica de negocio y usando respuestas estandarizadas.
 * Define la estructura para futuros controladores.
 */

const { asyncHandler } = require('../utils/async-handler.util');
const { sendSuccess } = require('../utils/response.util');
const { isDatabaseHealthy } = require('../config/database.config');

/**
 * GET /api/health
 *
 * Reporta el estado de la API y la conexión con la base de datos.
 */
const getHealth = asyncHandler(async (req, res) => {
  const databaseUp = await isDatabaseHealthy();

  sendSuccess(res, {
    message: 'Palm Health API en funcionamiento.',
    data: {
      status: 'ok',
      database: databaseUp ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { getHealth };
