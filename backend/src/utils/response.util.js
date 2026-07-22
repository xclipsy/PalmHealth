/**
 * Standardized API response helpers (Part 8 of the specification).
 *
 * Every response in the application — success or error — carries the
 * exact same four-key JSON shape so the frontend can rely on it:
 *   {
 *     "success": boolean,
 *     "message": string,
 *     "data":    object | array | null,
 *     "errors":  array | null
 *   }
 */

const { HTTP_STATUS } = require('../constants/http-status.constants');

/**
 * Sends a success response.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} [options.statusCode=200]
 * @param {string} options.message - User-facing message in Spanish.
 * @param {*} [options.data=null]
 * @param {Object} [options.pagination] - Optional pagination metadata for list endpoints.
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
 * Sends an error response. Used only by the error middlewares — business
 * code must throw AppError subclasses instead of calling this directly.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {number} options.statusCode
 * @param {string} options.message - Safe, user-facing message in Spanish.
 * @param {Array<Object>|null} [options.errors=null] - Field-level details.
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
