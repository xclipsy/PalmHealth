/**
 * Servicio de pacientes: contiene la lógica de negocio para todos los
 * endpoints de /api/patient/*.
 *
 * Modelo de propiedad (Partes 3 y 4): todas las consultas están limitadas
 * al propio ID del paciente autenticado (req.patient inyectado por el
 * middleware de autorización). Los IDs de la URL solo se aceptan para
 * recursos y luego se vuelven a validar contra el ID del paciente solicitante.
 *
 * Los pacientes solo pueden ESCRIBIR: su perfil (campos limitados) y su
 * registro de síntomas. Todo lo demás es de solo lectura.
 */
const { patientRepository } = require('../repositories/patient.repository');
const { assignmentRepository } = require('../repositories/assignment.repository');
const { appointmentRepository } = require('../repositories/appointment.repository');
const { symptomRepository } = require('../repositories/symptom.repository');
const { treatmentRepository } = require('../repositories/treatment.repository');
const { medicationRepository } = require('../repositories/medication.repository');
const { routineRepository } = require('../repositories/routine.repository');
const { observationRepository } = require('../repositories/observation.repository');
const { notificationRepository } = require('../repositories/notification.repository');
const notificationService = require('./notification.service');
const {
  NotFoundError,
  BusinessRuleError,
} = require('../errors/app.errors');
const {
  APPOINTMENT_STATUS,
  TREATMENT_STATUS,
  NOTIFICATION_TYPES,
} = require('../constants/app.constants');

/**
 * Resumen del panel principal: próxima cita, contadores activos,
 * síntomas recientes y profesional asignado (Parte 4).
 *
 * @param {Object} patient - Fila de req.patient.
 * @param {number} userId - users.id del usuario solicitante.
 * @returns {Promise<Object>}
 */
const getDashboard = async (patient, userId) => {
  const [nextAppointments, activeTreatments, activeMedications, recentSymptoms, professionals, unreadCount] =
    await Promise.all([
      appointmentRepository.findAll(
        { patientId: patient.id, status: APPOINTMENT_STATUS.SCHEDULED, from: new Date().toISOString() },
        { limit: 1, offset: 0, sort: 'scheduled_at', order: 'asc' }
      ),
      treatmentRepository.findAll(
        { patientId: patient.id, status: TREATMENT_STATUS.ACTIVE },
        { limit: 5, offset: 0 }
      ),
      medicationRepository.findPrescriptions(
        { patientId: patient.id, status: TREATMENT_STATUS.ACTIVE },
        { limit: 5, offset: 0 }
      ),
      symptomRepository.findAll({ patientId: patient.id }, { limit: 3, offset: 0 }),
      assignmentRepository.findActiveProfessionalsForPatient(patient.id),
      notificationRepository.countUnread(userId),
    ]);

  return {
    nextAppointment: nextAppointments.rows[0] || null,
    activeTreatments: { items: activeTreatments.rows, total: activeTreatments.total },
    activeMedications: { items: activeMedications.rows, total: activeMedications.total },
    recentSymptoms: recentSymptoms.rows,
    assignedProfessionals: professionals,
    unreadNotifications: unreadCount,
  };
};

/**
 * Perfil completo incluyendo el correo de la cuenta.
 *
 * @param {Object} patient
 * @returns {Promise<Object>}
 */
const getProfile = async (patient) => {
  const profile = await patientRepository.findWithEmail(patient.id);
  if (!profile) {
    throw new NotFoundError('El perfil de paciente no existe.');
  }
  return profile;
};

/**
 * Actualiza únicamente los campos del perfil que el paciente puede editar.
 *
 * @param {Object} patient
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const updateProfile = async (patient, data) => {
  const updated = await patientRepository.updateProfile(patient.id, data);
  if (!updated) {
    throw new NotFoundError('El perfil de paciente no existe.');
  }
  return updated;
};

/**
 * Lista las citas del usuario solicitante con filtros.
 *
 * @param {Object} patient
 * @param {Object} filters - { status, from, to }.
 * @param {Object} options - paginación y ordenamiento.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
const listAppointments = (patient, filters, options) =>
  appointmentRepository.findAll({ ...filters, patientId: patient.id }, options);

/**
 * Cancela una de las citas programadas propias del paciente (los pacientes
 * pueden cancelar, pero nunca editar ni crear citas — Parte 4).
 *
 * @param {Object} patient
 * @param {number} appointmentId
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
const cancelAppointment = async (patient, appointmentId, reason) => {
  const appointment = await appointmentRepository.findDetailedById(appointmentId);

// Propiedad: la cita debe pertenecer al usuario solicitante.
  if (!appointment || appointment.patient_id !== patient.id) {
    throw new NotFoundError('La cita no existe.');
  }
  if (appointment.status !== APPOINTMENT_STATUS.SCHEDULED) {
    throw new BusinessRuleError('Solo se pueden cancelar citas programadas.');
  }

  const cancelled = await appointmentRepository.cancel(
    appointmentId,
    APPOINTMENT_STATUS.CANCELLED,
    reason
  );

// Notifica al profesional (sin bloquear la operación).
  const professionalUser = await appointmentProfessionalUserId(appointment);
  if (professionalUser) {
    await notificationService.emit({
      userId: professionalUser,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      title: 'Cita cancelada',
      message: `${patient.first_name} ${patient.last_name} canceló la cita programada.`,
      relatedEntity: 'appointment',
      relatedId: appointmentId,
    });
  }

  return cancelled;
};

/**
 * Obtiene el ID de usuario del profesional asociado a una cita.
 *
 * @param {Object} appointment
 * @returns {Promise<number|null>}
 */
const appointmentProfessionalUserId = async (appointment) => {
  const { professionalRepository } = require('../repositories/professional.repository');
  const professional = await professionalRepository.findById(appointment.professional_id);
  return professional ? professional.user_id : null;
};

/**
 * Vista de calendario: citas dentro de un rango mensual (Parte 4).
 *
 * @param {Object} patient
 * @param {number} year
 * @param {number} month - 1-12.
 * @returns {Promise<Array<Object>>}
 */
const getCalendar = async (patient, year, month) => {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
  const result = await appointmentRepository.findAll(
    { patientId: patient.id, from, to },
    { limit: 100, offset: 0, sort: 'scheduled_at', order: 'asc' }
  );
  return result.rows;
};

/**
 * Lista los síntomas del usuario solicitante con filtros
 * (categoría, fechas e intensidad).
 */
const listSymptoms = (patient, filters, options) =>
  symptomRepository.findAll({ ...filters, patientId: patient.id }, options);

/**
 * Obtiene uno de los síntomas propios del usuario solicitante.
 *
 * @param {Object} patient
 * @param {number} symptomId
 * @returns {Promise<Object>}
 */
const getSymptom = async (patient, symptomId) => {
  const symptom = await symptomRepository.findDetailedById(symptomId);
  if (!symptom || symptom.patient_id !== patient.id) {
    throw new NotFoundError('El síntoma no existe.');
  }
  return symptom;
};

/**
 * Registra un síntoma: la operación principal de escritura del paciente
 * (Parte 4).
 *
 * Notifica al profesional o profesionales asignados.
 *
 * @param {Object} patient
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createSymptom = async (patient, data) => {
  const categoryOk = await symptomRepository.categoryExists(data.categoryId);
  if (!categoryOk) {
    throw new NotFoundError('La categoría de síntoma no existe.');
  }

  const symptom = await symptomRepository.create({ ...data, patientId: patient.id });

  const professionals = await assignmentRepository.findActiveProfessionalsForPatient(patient.id);
  await Promise.all(
    professionals.map((pro) =>
      notificationService.emit({
        userId: pro.user_id,
        type: NOTIFICATION_TYPES.SYMPTOM,
        title: 'Nuevo síntoma registrado',
        message: `${patient.first_name} ${patient.last_name} registró un síntoma con intensidad ${data.intensity}/10.`,
        relatedEntity: 'symptom',
        relatedId: symptom.id,
      })
    )
  );

  return symptom;
};

/**
 * Actualiza uno de los síntomas propios del usuario solicitante.
 *
 * @param {Object} patient
 * @param {number} symptomId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const updateSymptom = async (patient, symptomId, data) => {
  await getSymptom(patient, symptomId); // ownership + existence

  if (data.categoryId) {
    const categoryOk = await symptomRepository.categoryExists(data.categoryId);
    if (!categoryOk) {
      throw new NotFoundError('La categoría de síntoma no existe.');
    }
  }

  return symptomRepository.update(symptomId, data);
};

/**
 * Actualiza uno de los síntomas propios del usuario solicitante.
 *
 * @param {Object} patient
 * @param {number} symptomId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const deleteSymptom = async (patient, symptomId) => {
  await getSymptom(patient, symptomId); // ownership + existence
  await symptomRepository.softDelete(symptomId);
};

/**
 * Lista el catálogo de categorías de síntomas.
 */
const listSymptomCategories = () => symptomRepository.findAllCategories();

/**
 * Lista los tratamientos del usuario solicitante (solo lectura, filtrados
 * por estado).
 */
const listTreatments = (patient, filters, options) =>
  treatmentRepository.findAll({ ...filters, patientId: patient.id }, options);

/**
 * Lista las recetas del usuario solicitante (solo lectura, filtradas
 * por estado).
 */
const listMedications = (patient, filters, options) =>
  medicationRepository.findPrescriptions({ ...filters, patientId: patient.id }, options);

/**
 * Lista las asignaciones de rutinas del usuario solicitante (solo lectura).
 */
const listRoutines = (patient, filters, options) =>
  routineRepository.findAssignments({ ...filters, patientId: patient.id }, options);

/**
 * Lista las observaciones marcadas explícitamente como visibles para el paciente.
 *
 * Las observaciones ocultas se excluyen directamente a nivel de SQL (Parte 5).
 */
const listVisibleObservations = (patient, options) =>
  observationRepository.findAll(
    { patientId: patient.id, visibleToPatient: true },
    options
  );

/**
 * Lista los profesionales actualmente asignados al usuario solicitante.
 */
const getAssignedProfessionals = (patient) =>
  assignmentRepository.findActiveProfessionalsForPatient(patient.id);

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  listAppointments,
  cancelAppointment,
  getCalendar,
  listSymptoms,
  getSymptom,
  createSymptom,
  updateSymptom,
  deleteSymptom,
  listSymptomCategories,
  listTreatments,
  listMedications,
  listRoutines,
  listVisibleObservations,
  getAssignedProfessionals,
};
