/**
 * Authentication controller (Part 3 of the specification).
 *
 * Thin HTTP layer: extracts validated input, delegates to
 * auth.service and shapes the standardized response. No business
 * logic, no SQL, no direct error formatting.
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.util');
const { asyncHandler } = require('../utils/async-handler.util');
const { HTTP_STATUS } = require('../constants/http-status.constants');

/** POST /api/auth/register/patient */
const registerPatient = asyncHandler(async (req, res) => {
  const result = await authService.registerPatient(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

/** POST /api/auth/register/professional */
const registerProfessional = asyncHandler(async (req, res) => {
  const result = await authService.registerProfessional(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  sendSuccess(res, {
    message: 'Inicio de sesión exitoso.',
    data: result,
  });
});

/**
 * POST /api/auth/logout
 * JWT is stateless — the server holds no session. This endpoint exists
 * so the frontend has a consistent hook: it discards the stored token
 * client-side after calling it.
 */
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Sesión cerrada correctamente.',
    data: null,
  });
});

/**
 * POST /api/auth/forgot-password
 * MVP: simulated flow (no real email delivery). Always responds with
 * the same message whether or not the email exists — prevents user
 * enumeration.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message:
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    data: null,
  });
});

/** GET /api/auth/profile — requires authentication. */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, {
    message: 'Perfil obtenido correctamente.',
    data: { user },
  });
});

module.exports = {
  registerPatient,
  registerProfessional,
  login,
  logout,
  forgotPassword,
  getProfile,
};
