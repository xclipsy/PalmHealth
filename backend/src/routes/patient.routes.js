/**
 * Patient routes — /api/patient/*
 *
 * Chain per request (Parts 3, 6): authenticateToken -> authorizeRole
 * (router perimeter) -> attachPatientProfile (ownership root) ->
 * validators -> controller.
 */

const express = require('express');

const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');
const { attachPatientProfile } = require('../middlewares/ownership.middleware');
const { USER_ROLES } = require('../constants/app.constants');
const controller = require('../controllers/patient.controller');
const {
  updateProfileValidator,
  listAppointmentsValidator,
  cancelAppointmentValidator,
  listSymptomsValidator,
  createSymptomValidator,
  updateSymptomValidator,
  statusFilterValidator,
} = require('../validators/patient.validators');
const {
  idParamValidator,
  paginationValidator,
  updateSettingsValidator,
} = require('../validators/common.validators');

const router = express.Router();

// Perimeter guard: valid JWT + PATIENT role + own profile attached.
router.use(authenticateToken, authorizeRole(USER_ROLES.PATIENT), attachPatientProfile);

// Dashboard
router.get('/dashboard', controller.getDashboard);

// Profile (limited editable fields)
router.get('/profile', controller.getProfile);
router.put('/profile', updateProfileValidator, controller.updateProfile);

// Appointments (view + cancel only)
router.get('/appointments', listAppointmentsValidator, controller.listAppointments);
router.patch(
  '/appointments/:id/cancel',
  cancelAppointmentValidator,
  controller.cancelAppointment
);

// Calendar
router.get('/calendar', controller.getCalendar);

// Symptoms (full CRUD — the patient's core write feature)
router.get('/symptoms/categories', controller.listSymptomCategories);
router.get('/symptoms', listSymptomsValidator, controller.listSymptoms);
router.get('/symptoms/:id', idParamValidator, controller.getSymptom);
router.post('/symptoms', createSymptomValidator, controller.createSymptom);
router.put('/symptoms/:id', updateSymptomValidator, controller.updateSymptom);
router.delete('/symptoms/:id', idParamValidator, controller.deleteSymptom);

// Read-only clinical data
router.get('/treatments', statusFilterValidator, controller.listTreatments);
router.get('/medications', statusFilterValidator, controller.listMedications);
router.get('/routines', statusFilterValidator, controller.listRoutines);
router.get('/observations', paginationValidator, controller.listObservations);
router.get('/professionals', controller.getAssignedProfessionals);

// Notifications
router.get('/notifications', paginationValidator, controller.listNotifications);
router.patch(
  '/notifications/:id/read',
  idParamValidator,
  controller.markNotificationRead
);
router.delete('/notifications/:id', idParamValidator, controller.deleteNotification);

// Settings
router.get('/settings', controller.getSettings);
router.put('/settings', updateSettingsValidator, controller.updateSettings);

module.exports = router;
