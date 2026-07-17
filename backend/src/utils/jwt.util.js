/**
 * JWT helpers (Part 3 of the specification).
 *
 * Tokens are stateless: the payload carries only { id, role } — never
 * email, names or any sensitive data. Secret and expiration come
 * exclusively from environment configuration.
 */

const jwt = require('jsonwebtoken');
const { env } = require('../config/env.config');
const { AuthenticationError } = require('../errors/app.errors');

/**
 * Signs an access token for an authenticated user.
 * @param {{ id: number, role: string }} payload - Minimal identity claims.
 * @returns {string} Signed JWT valid for env.jwtExpiresIn (default 24h).
 */
const signToken = (payload) => {
  if (!env.jwtSecret) {
    // Fail fast on misconfiguration instead of signing weak tokens.
    throw new Error('JWT_SECRET is not configured.');
  }
  return jwt.sign({ id: payload.id, role: payload.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

/**
 * Verifies a token signature and expiration.
 * @param {string} token - Raw JWT extracted from the Authorization header.
 * @returns {{ id: number, role: string }} Decoded claims.
 * @throws {AuthenticationError} When the token is invalid or expired.
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
