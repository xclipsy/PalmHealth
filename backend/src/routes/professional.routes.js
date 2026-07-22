/**
 * Professional routes — /api/professional/*
 *
 * Chain per request (Parts 3, 5, 6): authenticateToken ->
 * authorizeRole (router perimeter) -> attachProfessionalProfile
 * (ownership root) -> verifyPatientAssignment for URL patient ids ->
 * validators -> controller. Body-level patient ids are re-verified
 * inside the service.
 */

const express = require('express');

const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');
const {
  attachProfessionalProfile,
  verifyPatientAssignment,
} = require('../middlewares/ownership.middleware');
const { USER_ROLES } = require('../constants/app.constants');
const controller = require('../controllers/professional.controller');
const {
  updateProfileValidator,
  listPatientsValidator,
  linkPatientValidator,
  updateAssignmentValidator,
  listAppointmentsValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  listPatientSymptomsValidator,
  listObservationsValidator,
  createObservationValidator,
  updateObservationValidator,
  statusFilterValidator,
  createTreatmentValidator,
  updateTreatmentValidator,
  createPrescriptionValidator,
  updatePrescriptionValidator,
  routineCatalogValidator,
  createRoutineAssignmentValidator,
  updateRoutineAssignmentValidator,
  medicationCatalogValidator,
} = require('../validators/professional.validators');
const {
  idParamValidator,
  paginationValidator,
  updateSettingsValidator,
} = require('../validators/common.validators');

const router = express.Router();

// Perimeter guard: valid JWT + PROFESSIONAL role + own profile attached.
router.use(
  authenticateToken,
  authorizeRole(USER_ROLES.PROFESSIONAL),
  attachProfessionalProfile
);

// Dashboard
router.get('/dashboard', controller.getDashboard);

// Profile (license number is never editable)
router.get('/profile', controller.getProfile);
router.put('/profile', updateProfileValidator, controller.updateProfile);

// Patients (directory, detail, medical linking)
router.get('/patients', listPatientsValidator, controller.listPatients);
router.post('/patients/link', linkPatientValidator, controller.linkPatient);
router.get(
  '/patients/:id',
  idParamValidator,
  verifyPatientAssignment(),
  controller.getPatientDetail
);
router.patch(
  '/patients/:id/assignment',
  updateAssignmentValidator,
  controller.updateAssignment
);
router.get(
  '/patients/:id/symptoms',
  listPatientSymptomsValidator,
  verifyPatientAssignment(),
  controller.listPatientSymptoms
);

// Appointments (full management)
router.get('/appointments', listAppointmentsValidator, controller.listAppointments);
router.post('/appointments', createAppointmentValidator, controller.createAppointment);
router.put('/appointments/:id', updateAppointmentValidator, controller.updateAppointment);
router.patch(
  '/appointments/:id/cancel',
  cancelAppointmentValidator,
  controller.cancelAppointment
);

// Calendar
router.get('/calendar', controller.getCalendar);

// Observations (author-only edits enforced in service)
router.get('/observations', listObservationsValidator, controller.listObservations);
router.post('/observations', createObservationValidator, controller.createObservation);
router.put('/observations/:id', updateObservationValidator, controller.updateObservation);

// Treatments
router.get('/treatments', statusFilterValidator, controller.listTreatments);
router.post('/treatments', createTreatmentValidator, controller.createTreatment);
router.put('/treatments/:id', updateTreatmentValidator, controller.updateTreatment);

// Medications (catalog + prescriptions)
router.get(
  '/medications/catalog',
  medicationCatalogValidator,
  controller.listMedicationCatalog
);
router.get('/medications', statusFilterValidator, controller.listPrescriptions);
router.post('/medications', createPrescriptionValidator, controller.createPrescription);
router.put('/medications/:id', updatePrescriptionValidator, controller.updatePrescription);

// Routines (catalog + assignments)
router.get('/routines/catalog', routineCatalogValidator, controller.listRoutineCatalog);
router.get('/routines', statusFilterValidator, controller.listRoutineAssignments);
router.post('/routines', createRoutineAssignmentValidator, controller.createRoutineAssignment);
router.put('/routines/:id', updateRoutineAssignmentValidator, controller.updateRoutineAssignment);

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
