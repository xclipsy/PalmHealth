/**
 * Patient controller — thin HTTP layer for /api/patient/*.
 *
 * Every handler: reads validated input, delegates to the patient
 * service and responds through sendSuccess. No business logic and
 * no SQL live here (Part 6 architecture rules).
 */

const patientService = require('../services/patient.service');
const notificationService = require('../services/notification.service');
const settingsService = require('../services/settings.service');
const { asyncHandler } = require('../utils/async-handler.util');
const { sendSuccess } = require('../utils/response.util');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination.util');
const { HTTP_STATUS } = require('../constants/http-status.constants');

/** GET /api/patient/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const data = await patientService.getDashboard(req.patient, req.user.id);
  sendSuccess(res, { message: 'Resumen del paciente obtenido correctamente.', data });
});

/** GET /api/patient/profile */
const getProfile = asyncHandler(async (req, res) => {
  const data = await patientService.getProfile(req.patient);
  sendSuccess(res, { message: 'Perfil obtenido correctamente.', data });
});

/** PUT /api/patient/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const data = await patientService.updateProfile(req.patient, req.body);
  sendSuccess(res, { message: 'Perfil actualizado correctamente.', data });
});

/** GET /api/patient/appointments */
const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listAppointments(
    req.patient,
    { status: req.query.status, from: req.query.from, to: req.query.to },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Citas obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** PATCH /api/patient/appointments/:id/cancel */
const cancelAppointment = asyncHandler(async (req, res) => {
  const data = await patientService.cancelAppointment(
    req.patient,
    Number(req.params.id),
    req.body.reason
  );
  sendSuccess(res, { message: 'Cita cancelada correctamente.', data });
});

/** GET /api/patient/calendar?year=YYYY&month=M */
const getCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getUTCFullYear();
  const month = Number(req.query.month) || now.getUTCMonth() + 1;
  const data = await patientService.getCalendar(req.patient, year, month);
  sendSuccess(res, { message: 'Calendario obtenido correctamente.', data });
});

/** GET /api/patient/symptoms */
const listSymptoms = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listSymptoms(
    req.patient,
    {
      categoryId: req.query.categoryId,
      minIntensity: req.query.minIntensity,
      from: req.query.from,
      to: req.query.to,
    },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Síntomas obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/patient/symptoms/categories */
const listSymptomCategories = asyncHandler(async (req, res) => {
  const data = await patientService.listSymptomCategories();
  sendSuccess(res, { message: 'Categorías obtenidas correctamente.', data });
});

/** GET /api/patient/symptoms/:id */
const getSymptom = asyncHandler(async (req, res) => {
  const data = await patientService.getSymptom(req.patient, Number(req.params.id));
  sendSuccess(res, { message: 'Síntoma obtenido correctamente.', data });
});

/** POST /api/patient/symptoms */
const createSymptom = asyncHandler(async (req, res) => {
  const data = await patientService.createSymptom(req.patient, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Síntoma registrado correctamente.',
    data,
  });
});

/** PUT /api/patient/symptoms/:id */
const updateSymptom = asyncHandler(async (req, res) => {
  const data = await patientService.updateSymptom(
    req.patient,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Síntoma actualizado correctamente.', data });
});

/** DELETE /api/patient/symptoms/:id */
const deleteSymptom = asyncHandler(async (req, res) => {
  await patientService.deleteSymptom(req.patient, Number(req.params.id));
  sendSuccess(res, { message: 'Síntoma eliminado correctamente.' });
});

/** GET /api/patient/treatments */
const listTreatments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listTreatments(
    req.patient,
    { status: req.query.status },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Tratamientos obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/patient/medications */
const listMedications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listMedications(
    req.patient,
    { status: req.query.status },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Medicamentos obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/patient/routines */
const listRoutines = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listRoutines(
    req.patient,
    { status: req.query.status },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Rutinas obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/patient/observations — only entries marked visible. */
const listObservations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await patientService.listVisibleObservations(req.patient, {
    limit,
    offset,
  });
  sendSuccess(res, {
    message: 'Observaciones obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/patient/professionals — assigned professional(s). */
const getAssignedProfessionals = asyncHandler(async (req, res) => {
  const data = await patientService.getAssignedProfessionals(req.patient);
  sendSuccess(res, { message: 'Profesionales asignados obtenidos correctamente.', data });
});

/** GET /api/patient/notifications */
const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await notificationService.listForUser(
    req.user.id,
    { unreadOnly: req.query.unreadOnly === 'true' },
    { limit, offset }
  );
  sendSuccess(res, {
    message: 'Notificaciones obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** PATCH /api/patient/notifications/:id/read */
const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(Number(req.params.id), req.user.id);
  sendSuccess(res, { message: 'Notificación marcada como leída.', data });
});

/** DELETE /api/patient/notifications/:id */
const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.remove(Number(req.params.id), req.user.id);
  sendSuccess(res, { message: 'Notificación eliminada correctamente.' });
});

/** GET /api/patient/settings */
const getSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getForUser(req.user.id);
  sendSuccess(res, { message: 'Preferencias obtenidas correctamente.', data });
});

/** PUT /api/patient/settings */
const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateForUser(req.user.id, req.body);
  sendSuccess(res, { message: 'Preferencias actualizadas correctamente.', data });
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  listAppointments,
  cancelAppointment,
  getCalendar,
  listSymptoms,
  listSymptomCategories,
  getSymptom,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  listTreatments,
  listMedications,
  listRoutines,
  listObservations,
  getAssignedProfessionals,
  listNotifications,
  markNotificationRead,
  deleteNotification,
  getSettings,
  updateSettings,
};
