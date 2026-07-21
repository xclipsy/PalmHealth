/**
 * Middlewares globales de manejo de errores.
 *
 * Registrados al final en app.js. Transforman errores al formato
 * JSON estándar sin exponer trazas, SQL ni rutas internas al cliente.
 */

const { AppError } = require('../errors/app.errors');
const { HTTP_STATUS } = require('../constants/http-status.constants');
const { sendError } = require('../utils/response.util');
const { logger } = require('../utils/logger.util');

/**
 * Manejo 404 para rutas API no existentes.
 *
 * Las rutas no API son gestionadas por el fallback de la SPA.
 */
const notFoundHandler = (req, res) => {
  sendError(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: 'El recurso solicitado no existe.',
  });
};

/**
 * Manejador global de errores.
 *
 * Los AppErrors usan su propio estado y mensaje; errores inesperados
 * responden con 500 genérico y se registran internamente con detalle.
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

  // JSON mal formado recibido por express.json(): error del cliente, no 500.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'El cuerpo de la solicitud no es un JSON válido.',
    });
  }
// Error inesperado: registrar internamente y responder de forma genérica.
  logger.error(`Unexpected error on ${req.method} ${req.originalUrl}`, err);

  return sendError(res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.',
  });
};

module.exports = { notFoundHandler, errorHandler };
