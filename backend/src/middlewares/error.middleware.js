/**
 * Global error handling middlewares.
 *
 * Registered last in app.js. Converts thrown errors into the
 * standardized JSON response format:
 *   { success: false, message, data: null, errors }
 *
 * Never leaks stack traces, SQL or internal paths to the client.
 */

const { AppError } = require('../errors/app.errors');
const { HTTP_STATUS } = require('../constants/http-status.constants');
const { sendError } = require('../utils/response.util');
const { logger } = require('../utils/logger.util');

/**
 * 404 handler for unknown API routes.
 * (Non-API routes are handled by the SPA fallback before this runs.)
 */
const notFoundHandler = (req, res) => {
  sendError(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: 'El recurso solicitado no existe.',
  });
};

/**
 * Global error handler. Operational AppErrors respond with their own
 * status and message; unexpected errors respond with a generic 500.
 * Every unexpected error is logged internally with full detail.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || null,
    });
  }

  // Malformed JSON body from express.json() — client error, not a 500.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'El cuerpo de la solicitud no es un JSON válido.',
    });
  }

  // Unexpected error: log internally, respond generically.
  logger.error(`Unexpected error on ${req.method} ${req.originalUrl}`, err);

  return sendError(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.',
  });
};

module.exports = { notFoundHandler, errorHandler };
