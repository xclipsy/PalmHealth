/**
 * Rutas de autenticación (Parte 8 de la especificación).
 *
 * Endpoints públicos (registro, inicio de sesión, cierre de sesión,
 * recuperación de contraseña) más el endpoint de perfil autenticado.
 *
 * Cadena por ruta:
 *   validadores -> handleValidationErrors -> controlador
 *
 * Para /profile:
 *   authenticateToken -> controlador.
 */

const express = require('express');

const authController = require('../controllers/auth.controller');
const {
  registerPatientValidator,
  registerProfessionalValidator,
  loginValidator,
  forgotPasswordValidator,
} = require('../validators/auth.validators');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register/patient', registerPatientValidator, authController.registerPatient);
router.post(
  '/register/professional',
  registerProfessionalValidator,
  authController.registerProfessional
);
router.post('/login', loginValidator, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
