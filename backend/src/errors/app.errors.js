/**
 * Clases de errores reutilizables de la aplicación (Parte 6).
 *
 * Cada clase representa un código HTTP específico. Servicios y
 * repositorios los lanzan; el middleware global genera la respuesta JSON estándar.
 */

const { HTTP_STATUS } = require('../constants/http-status.constants');

/**
 * Clase base para errores operacionales esperados de la aplicación.
 */
class AppError extends Error {
 /**
 * @param {string} message - Mensaje visible para el usuario (español).
 * @param {number} statusCode - Código HTTP de respuesta.
 * @param {Array<Object>} [errors] - Detalles opcionales de errores por campo.
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

/** 422 - Datos de la solicitud no superan la validación. */
class ValidationError extends AppError {
  constructor(message = 'Los datos enviados no son válidos.', errors = undefined) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }
}

/** 401 - Credenciales o token faltantes/no válidos. */
class AuthenticationError extends AppError {
  constructor(message = 'Credenciales inválidas o sesión expirada.') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/** 403 - Autenticado, pero sin permisos (rol o propiedad inválida). */
class AuthorizationError extends AppError {
  constructor(message = 'No tienes permisos para acceder a este recurso.') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/** 404 - Recurso inexistente o eliminado lógicamente. */
class NotFoundError extends AppError {
  constructor(message = 'El recurso solicitado no existe.') {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

/** 409 - Conflicto de unicidad (ej. email ya registrado). */
class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe.') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/** 400 - Violación de reglas de negocio o dominio. */
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
