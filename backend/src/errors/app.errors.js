/**
 * Reusable application error classes (Part 6 of the specification).
 *
 * Each class maps to a specific HTTP status code. Services and
 * repositories throw these; the global error middleware translates
 * them into the standardized JSON response format.
 */

const { HTTP_STATUS } = require('../constants/http-status.constants');

/** Base class for every expected (operational) application error. */
class AppError extends Error {
  /**
   * @param {string} message - User-friendly message (Spanish, UI-facing).
   * @param {number} statusCode - HTTP status code to respond with.
   * @param {Array<Object>} [errors] - Optional field-level error details.
   */
  constructor(message, statusCode, errors = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 422 - Request payload failed validation. */
class ValidationError extends AppError {
  constructor(message = 'Los datos enviados no son válidos.', errors = undefined) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}

/** 401 - Missing or invalid credentials/token. */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciales inválidas o sesión expirada.') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/** 403 - Authenticated but not allowed (role or ownership violation). */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para acceder a este recurso.') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/** 404 - Resource does not exist (or is soft-deleted). */
class NotFoundError extends AppError {
  constructor(message = 'El recurso solicitado no existe.') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

/** 409 - Uniqueness conflict (e.g. email already registered). */
class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe.') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/** 400 - Domain/business rule violation. */
class BusinessRuleError extends AppError {
  constructor(message = 'La operación no está permitida por las reglas de negocio.') {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
};
