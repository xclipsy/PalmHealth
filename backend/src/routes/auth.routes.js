// Rutas de Autenticación y Gestión de Cuenta.
const express = require('express');

const authController = require('../controllers/auth.controller');
const {
  registerPatientValidator,
  registerProfessionalValidator,
  loginValidator,
  changePasswordValidator,
} = require('../validators/auth.validators');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Rutas Públicas
router.post('/register/patient', registerPatientValidator, authController.registerPatient);
router.post('/register/professional', registerProfessionalValidator, authController.registerProfessional);
router.post('/login', loginValidator, authController.login);
router.post('/logout', authController.logout);

// Rutas Autenticadas
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, changePasswordValidator, authController.changePassword);
router.delete('/account', authenticateToken, authController.deleteAccount);

module.exports = router;
