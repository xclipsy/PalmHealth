/**
 * Controlador de autenticación (Parte 3).
 *
 * Capa HTTP ligera: recibe datos validados, delega en auth.service
 * y genera respuestas estandarizadas. Sin lógica de negocio ni SQL.
 */
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.util');
const { asyncHandler } = require('../utils/async-handler.util');
const { HTTP_STATUS } = require('../constants/http-status.constants');

// POST /api/auth/register/patient
const registerPatient = asyncHandler(async (req, res) => {
  const result = await authService.registerPatient(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

// POST /api/auth/register/professional
const registerProfessional = asyncHandler(async (req, res) => {
  const result = await authService.registerProfessional(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  sendSuccess(res, {
    message: 'Inicio de sesión exitoso.',
    data: result,
  });
});

/**
 * POST /api/auth/logout
 *
 * JWT es sin estado: el servidor no guarda sesiones.
 * El frontend elimina el token almacenado al llamar este endpoint.
 */
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Sesión cerrada correctamente.',
    data: null,
  });
});

/**
 * POST /api/auth/forgot-password
 *
 * Flujo simulado del MVP (sin envío real de correos).
 * Usa la misma respuesta para evitar revelar si el email existe.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message:
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    data: null,
  });
});

// GET /api/auth/profile — requiere autenticación.
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
