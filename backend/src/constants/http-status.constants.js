/**
 * Constantes de códigos HTTP (Parte 8).
 *
 * Centraliza los códigos usados por la API para evitar valores
 * numéricos repetidos en controladores, errores y middlewares.
 */

const HTTP_STATUS = Object.freeze({
 // Éxito
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Errores del cliente
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Errores del servidor
  INTERNAL_SERVER_ERROR: 500,
});

module.exports = { HTTP_STATUS };
