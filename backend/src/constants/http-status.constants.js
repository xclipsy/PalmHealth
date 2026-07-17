/**
 * HTTP status code constants (Part 8 of the specification).
 *
 * Every status code used by the API is declared here so controllers,
 * error classes and middlewares never hardcode numeric values.
 */

const HTTP_STATUS = Object.freeze({
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
});

module.exports = { HTTP_STATUS };
