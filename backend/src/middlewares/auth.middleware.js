/**
 * Middlewares de autenticación y autorización (Parte 3).
 *
 * Cadena de autorización: authenticateToken -> authorizeRole(...) ->
 * validación de propiedad -> controlador. Las rutas privadas pasan
 * por esta cadena antes de ejecutar lógica de negocio.
 */
const { verifyToken } = require('../utils/jwt.util');
const { userRepository } = require('../repositories/user.repository');
const { USER_STATUS } = require('../constants/app.constants');
const { AuthenticationError, AuthorizationError } = require('../errors/app.errors');

/**
 * Esquema de autorización esperado: "Bearer <token>".
 */
const BEARER_PREFIX = 'Bearer ';

/**
 * Verifica el JWT Bearer y agrega { id, role } a req.user.
 *
 * Validaciones:
 * 1. Header presente con esquema Bearer.
 * 2. Token válido y no expirado.
 * 3. Usuario existente y no eliminado.
 * 4. Cuenta activa para permitir acceso.
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

  // Identidad mínima para capas posteriores: el rol viene de la BD,
// no del token, permitiendo aplicar cambios de permisos al instante.
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Fábrica de guardas por rol. Se ejecuta después de authenticateToken.
 *
 * @param {...string} roles - Roles permitidos (valores de USER_ROLES).
 * @returns {import('express').RequestHandler} 403 si el rol no está autorizado.
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
