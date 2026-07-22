/**
 * Health controller.
 *
 * Reference implementation of the controller layer: thin, no business
 * logic, wrapped in asyncHandler and responding only through the
 * standardized response helpers. Every future controller follows this
 * exact shape.
 */

const { asyncHandler } = require('../utils/async-handler.util');
const { sendSuccess } = require('../utils/response.util');
const { isDatabaseHealthy } = require('../config/database.config');

/**
 * GET /api/health
 * Reports API liveness and database connectivity.
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
