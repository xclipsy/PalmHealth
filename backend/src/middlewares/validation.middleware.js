/**
 * Middleware de resultados de validación.
 *
 * Procesa errores de express-validator y los convierte en respuesta
 * 422 estándar mediante ValidationError. Evita que los controladores
 * reciban datos inválidos o manejen errores de validación.
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/app.errors');

/**
 * Rechaza la solicitud con 422 si falla alguna validación.
 *
 * Los mensajes son visibles para el usuario y están en español.
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
