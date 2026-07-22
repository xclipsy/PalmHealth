// Controlador de Autenticación y Gestión de Cuenta.
const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response.util');
const { asyncHandler } = require('../utils/async-handler.util');
const { HTTP_STATUS } = require('../constants/http-status.constants');

// Registro de Paciente
const registerPatient = asyncHandler(async (req, res) => {
  const result = await authService.registerPatient(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

// Registro de Profesional de la Salud
const registerProfessional = asyncHandler(async (req, res) => {
  const result = await authService.registerProfessional(req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Registro exitoso. Bienvenido a Palm Health.',
    data: result,
  });
});

// Inicio de Sesión
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  sendSuccess(res, {
    message: 'Inicio de sesión exitoso.',
    data: result,
  });
});

// Cierre de Sesión
const logout = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Sesión cerrada correctamente.',
    data: null,
  });
});

// Obtener Perfil Autenticado
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, {
    message: 'Perfil obtenido correctamente.',
    data: { user },
  });
});

// Cambiar Contraseña (usuario autenticado)
const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.newPassword
  );
  sendSuccess(res, {
    message: 'Contraseña actualizada correctamente.',
    data: null,
  });
});

// Eliminar Cuenta (usuario autenticado)
const deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user.id);
  sendSuccess(res, {
    message: 'Tu cuenta ha sido eliminada correctamente.',
    data: null,
  });
});

module.exports = {
  registerPatient,
  registerProfessional,
  login,
  logout,
  getProfile,
  changePassword,
  deleteAccount,
};
