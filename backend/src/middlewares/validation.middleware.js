/**
 * Validation result middleware.
 *
 * Runs after express-validator chains (see /src/validators). Collects
 * validation errors and converts them into the standardized 422
 * response via ValidationError, so controllers never receive invalid
 * input and never format validation errors themselves.
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/app.errors');

/**
 * Rejects the request with 422 when any validator in the chain failed.
 * Error messages are user-facing and therefore written in Spanish.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new ValidationError('Los datos enviados no son válidos.', errors));
};

module.exports = { handleValidationErrors };
