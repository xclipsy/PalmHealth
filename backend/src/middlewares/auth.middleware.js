/**
 * Authentication and authorization middlewares (Part 3).
 *
 * Authorization chain: authenticateToken -> authorizeRole(...) ->
 * ownership middleware/service checks -> controller. Every private
 * route passes through this chain before any business logic runs.
 */

const { verifyToken } = require('../utils/jwt.util');
const { userRepository } = require('../repositories/user.repository');
const { USER_STATUS } = require('../constants/app.constants');
const { AuthenticationError, AuthorizationError } = require('../errors/app.errors');

/** Expected authorization scheme: "Bearer <token>". */
const BEARER_PREFIX = 'Bearer ';

/**
 * Verifies the Bearer JWT and attaches { id, role } to req.user.
 *
 * Steps (in order, failing fast):
 *   1. Header present and uses the Bearer scheme.
 *   2. Token signature and expiration are valid.
 *   3. The user still exists (not soft-deleted).
 *   4. The account is ACTIVE (suspended/inactive users lose access
 *      immediately, even with a still-valid token).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticateToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';

    if (!header.startsWith(BEARER_PREFIX)) {
      throw new AuthenticationError('Debes iniciar sesión para acceder a este recurso.');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw new AuthenticationError('Debes iniciar sesión para acceder a este recurso.');
    }

    const claims = verifyToken(token);

    const user = await userRepository.findSafeById(claims.id);
    if (!user) {
      throw new AuthenticationError('La cuenta ya no existe. Inicia sesión nuevamente.');
    }
    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AuthenticationError('Tu cuenta no está activa.');
    }

    // Minimal identity for downstream layers — role comes from the
    // database row, not the token, so demotions apply instantly.
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role guard factory. Must run after authenticateToken.
 * @param {...string} roles - Allowed roles (USER_ROLES values).
 * @returns {import('express').RequestHandler} 403 when the
 *   authenticated user's role is not in the allowed list.
 */
const authorizeRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('Debes iniciar sesión para acceder a este recurso.'));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AuthorizationError('No tienes permisos para acceder a este recurso.'));
  }
  return next();
};

module.exports = { authenticateToken, authorizeRole };
