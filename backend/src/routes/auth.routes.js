/**
 * Authentication routes (Part 8 of the specification).
 *
 * Public endpoints (register, login, logout, forgot-password) plus the
 * authenticated profile endpoint. Chain per route:
 *   validators -> handleValidationErrors -> controller
 * and for /profile: authenticateToken -> controller.
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
