/**
 * Professional controller — thin HTTP layer for /api/professional/*.
 *
 * Every handler: reads validated input, delegates to the professional
 * service and responds through sendSuccess. No business logic and no
 * SQL live here (Part 6 architecture rules).
 */

const professionalService = require('../services/professional.service');
const notificationService = require('../services/notification.service');
const settingsService = require('../services/settings.service');
const { asyncHandler } = require('../utils/async-handler.util');
const { sendSuccess } = require('../utils/response.util');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination.util');
const { HTTP_STATUS } = require('../constants/http-status.constants');

/** GET /api/professional/dashboard */
const getDashboard = asyncHandler(async (req, res) => {
  const data = await professionalService.getDashboard(req.professional, req.user.id);
  sendSuccess(res, { message: 'Resumen del profesional obtenido correctamente.', data });
});

/** GET /api/professional/profile */
const getProfile = asyncHandler(async (req, res) => {
  const data = await professionalService.getProfile(req.professional);
  sendSuccess(res, { message: 'Perfil obtenido correctamente.', data });
});

/** PUT /api/professional/profile */
const updateProfile = asyncHandler(async (req, res) => {
  const data = await professionalService.updateProfile(req.professional, req.body);
  sendSuccess(res, { message: 'Perfil actualizado correctamente.', data });
});

/** GET /api/professional/patients */
const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listPatients(
    req.professional,
    { search: req.query.search, status: req.query.status },
    { limit, offset }
  );
  sendSuccess(res, {
    message: 'Pacientes obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/professional/patients/:id — assignment verified by route guard. */
const getPatientDetail = asyncHandler(async (req, res) => {
  const data = await professionalService.getPatientDetail(Number(req.params.id));
  sendSuccess(res, { message: 'Detalle del paciente obtenido correctamente.', data });
});

/** POST /api/professional/patients/link */
const linkPatient = asyncHandler(async (req, res) => {
  const data = await professionalService.linkPatientByEmail(
    req.professional,
    req.body.email
  );
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Paciente vinculado correctamente.',
    data,
  });
});

/** PATCH /api/professional/patients/:id/assignment */
const updateAssignment = asyncHandler(async (req, res) => {
  const data = await professionalService.updateAssignmentStatus(
    req.professional,
    Number(req.params.id),
    req.body.status
  );
  sendSuccess(res, { message: 'Vinculación actualizada correctamente.', data });
});

/** GET /api/professional/patients/:id/symptoms — guard checked assignment. */
const listPatientSymptoms = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listPatientSymptoms(
    Number(req.params.id),
    {
      categoryId: req.query.categoryId,
      from: req.query.from,
      to: req.query.to,
    },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Síntomas del paciente obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** GET /api/professional/appointments */
const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listAppointments(
    req.professional,
    {
      status: req.query.status,
      patientId: req.query.patientId,
      from: req.query.from,
      to: req.query.to,
    },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Citas obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** POST /api/professional/appointments */
const createAppointment = asyncHandler(async (req, res) => {
  const data = await professionalService.createAppointment(req.professional, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Cita creada correctamente.',
    data,
  });
});

/** PUT /api/professional/appointments/:id */
const updateAppointment = asyncHandler(async (req, res) => {
  const data = await professionalService.updateAppointment(
    req.professional,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Cita actualizada correctamente.', data });
});

/** PATCH /api/professional/appointments/:id/cancel */
const cancelAppointment = asyncHandler(async (req, res) => {
  const data = await professionalService.cancelAppointment(
    req.professional,
    Number(req.params.id),
    req.body.reason
  );
  sendSuccess(res, { message: 'Cita cancelada correctamente.', data });
});

/** GET /api/professional/calendar?year=YYYY&month=M */
const getCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year) || now.getUTCFullYear();
  const month = Number(req.query.month) || now.getUTCMonth() + 1;
  const data = await professionalService.getCalendar(req.professional, year, month);
  sendSuccess(res, { message: 'Calendario obtenido correctamente.', data });
});

/** GET /api/professional/observations */
const listObservations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listObservations(
    req.professional,
    { patientId: req.query.patientId ? Number(req.query.patientId) : undefined },
    { limit, offset }
  );
  sendSuccess(res, {
    message: 'Observaciones obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** POST /api/professional/observations */
const createObservation = asyncHandler(async (req, res) => {
  const data = await professionalService.createObservation(req.professional, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Observación creada correctamente.',
    data,
  });
});

/** PUT /api/professional/observations/:id */
const updateObservation = asyncHandler(async (req, res) => {
  const data = await professionalService.updateObservation(
    req.professional,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Observación actualizada correctamente.', data });
});

/** GET /api/professional/treatments */
const listTreatments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listTreatments(
    req.professional,
    { status: req.query.status, patientId: req.query.patientId },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Tratamientos obtenidos correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** POST /api/professional/treatments */
const createTreatment = asyncHandler(async (req, res) => {
  const data = await professionalService.createTreatment(req.professional, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Tratamiento creado correctamente.',
    data,
  });
});

/** PUT /api/professional/treatments/:id */
const updateTreatment = asyncHandler(async (req, res) => {
  const data = await professionalService.updateTreatment(
    req.professional,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Tratamiento actualizado correctamente.', data });
});

/** GET /api/professional/medications/catalog */
const listMedicationCatalog = asyncHandler(async (req, res) => {
  const data = await professionalService.listMedicationCatalog(req.query.search);
  sendSuccess(res, { message: 'Catálogo de medicamentos obtenido correctamente.', data });
});

/** GET /api/professional/medications */
const listPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listPrescriptions(
    req.professional,
    { status: req.query.status, patientId: req.query.patientId },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Recetas obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** POST /api/professional/medications */
const createPrescription = asyncHandler(async (req, res) => {
  const data = await professionalService.createPrescription(req.professional, req.body);
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Medicamento recetado correctamente.',
    data,
  });
});

/** PUT /api/professional/medications/:id */
const updatePrescription = asyncHandler(async (req, res) => {
  const data = await professionalService.updatePrescription(
    req.professional,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Receta actualizada correctamente.', data });
});

/** GET /api/professional/routines/catalog */
const listRoutineCatalog = asyncHandler(async (req, res) => {
  const data = await professionalService.listRoutineCatalog(req.query.type);
  sendSuccess(res, { message: 'Catálogo de rutinas obtenido correctamente.', data });
});

/** GET /api/professional/routines */
const listRoutineAssignments = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await professionalService.listRoutineAssignments(
    req.professional,
    { status: req.query.status, patientId: req.query.patientId },
    { limit, offset, sort: req.query.sort, order: req.query.order }
  );
  sendSuccess(res, {
    message: 'Rutinas asignadas obtenidas correctamente.',
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

/** POST /api/professional/routines */
const createRoutineAssignment = asyncHandler(async (req, res) => {
  const data = await professionalService.createRoutineAssignment(
    req.professional,
    req.body
  );
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Rutina asignada correctamente.',
    data,
  });
});

/** PUT /api/professional/routines/:id */
const updateRoutineAssignment = asyncHandler(async (req, res) => {
  const data = await professionalService.updateRoutineAssignment(
    req.professional,
    Number(req.params.id),
    req.body
  );
  sendSuccess(res, { message: 'Rutina actualizada correctamente.', data });
});

/** GET /api/professional/notifications */
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

/** PATCH /api/professional/notifications/:id/read */
const markNotificationRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAsRead(Number(req.params.id), req.user.id);
  sendSuccess(res, { message: 'Notificación marcada como leída.', data });
});

/** DELETE /api/professional/notifications/:id */
const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.remove(Number(req.params.id), req.user.id);
  sendSuccess(res, { message: 'Notificación eliminada correctamente.' });
});

/** GET /api/professional/settings */
const getSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getForUser(req.user.id);
  sendSuccess(res, { message: 'Preferencias obtenidas correctamente.', data });
});

/** PUT /api/professional/settings */
const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateForUser(req.user.id, req.body);
  sendSuccess(res, { message: 'Preferencias actualizadas correctamente.', data });
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  listPatients,
  getPatientDetail,
  linkPatient,
  updateAssignment,
  listPatientSymptoms,
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getCalendar,
  listObservations,
  createObservation,
  updateObservation,
  listTreatments,
  createTreatment,
  updateTreatment,
  listMedicationCatalog,
  listPrescriptions,
  createPrescription,
  updatePrescription,
  listRoutineCatalog,
  listRoutineAssignments,
  createRoutineAssignment,
  updateRoutineAssignment,
  listNotifications,
  markNotificationRead,
  deleteNotification,
  getSettings,
  updateSettings,
};
