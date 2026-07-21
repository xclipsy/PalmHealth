/**
 * Utilidades estandarizadas de respuestas API (Parte 8 de la especificación).
 *
 * Cada respuesta de la aplicación —éxito o error— utiliza exactamente
 * la misma estructura JSON de cuatro claves para que el frontend pueda
 * depender de ella:
 *   {
 *     "success": boolean,
 *     "message": string,
 *     "data":    object | array | null,
 *     "errors":  array | null
 *   }
 */

const { HTTP_STATUS } = require('../constants/http-status.constants');

/**
 * Envía una respuesta exitosa.
 *
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} options.message - Mensaje visible para el usuario en español.
 * @param {*} [options.data=null]
 * @param {Object} [options.pagination] - Metadatos de paginación opcionales para endpoints de listado.
 */
const sendSuccess = (res, { statusCode = HTTP_STATUS.OK, message, data = null, pagination }) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
    ...(pagination ? { pagination } : {}),
  });
};

/**
 * Envía una respuesta de error. Se utiliza únicamente por los middlewares
 * de manejo de errores; el código de negocio debe lanzar subclases de
 * AppError en lugar de llamar a esta función directamente.
 *
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} options.statusCode
 * @param {string} options.message - Mensaje seguro y visible para el usuario en español.
 * @param {Array<Object>|null} [options.errors=null] - Detalles específicos de campos.
 */
const sendError = (res, { statusCode, message, errors = null }) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  });
};

module.exports = { sendSuccess, sendError };
