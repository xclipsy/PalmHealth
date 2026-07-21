/**
 * Helpers para JWT (Parte 3 de la especificación).
 *
 * Los tokens son stateless: el payload solo contiene { id, role }, nunca
 * correo, nombres ni datos sensibles. El secreto y la expiración provienen
 * exclusivamente de las variables de entorno.
 */

const jwt = require('jsonwebtoken');
const { env } = require('../config/env.config');
const { AuthenticationError } = require('../errors/app.errors');

/**
 * Firma un token de acceso para un usuario autenticado.
 * @param {{ id: number, role: string }} payload - Claims mínimos de identidad.
 * @returns {string} JWT firmado válido según env.jwtExpiresIn (por defecto 24h).
 */
const signToken = (payload) => {
  if (!env.jwtSecret) {
    // Falla rápidamente ante configuraciones incorrectas en lugar de firmar tokens débiles.
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign({ id: payload.id, role: payload.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

/**
 * Verifica la firma y expiración de un token.
 * @param {string} token - JWT extraído directamente del encabezado Authorization.
 * @returns {{ id: number, role: string }} Claims decodificados.
 * @throws {AuthenticationError} Si el token es inválido o ha expirado.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }
    throw new AuthenticationError('Token inválido. Inicia sesión nuevamente.');
  }
};

module.exports = { signToken, verifyToken };
