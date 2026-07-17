/**
 * Patient service — business logic for every /api/patient/* endpoint.
 *
 * Ownership model (Parts 3, 4): all queries are scoped to the
 * authenticated patient's own id (req.patient injected by the
 * ownership middleware). Ids from the URL are only accepted for
 * resources and then re-checked against the caller's patient id.
 *
 * Patients can WRITE only: their profile (limited fields) and their
 * symptom log. Everything else is read-only.
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
 * Dashboard summary: next appointment, active counters, latest
 * symptoms and the assigned professional (Part 4).
 * @param {Object} patient - req.patient row.
 * @param {number} userId - users.id of the caller.
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
 * Full profile including account email.
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
 * Updates the patient-editable profile fields only.
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
 * Lists the caller's appointments with filters.
 * @param {Object} patient
 * @param {Object} filters - { status, from, to }.
 * @param {Object} options - pagination + sorting.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
const listAppointments = (patient, filters, options) =>
  appointmentRepository.findAll({ ...filters, patientId: patient.id }, options);

/**
 * Cancels one of the caller's own scheduled appointments (patients
 * may cancel but never edit or create — Part 4).
 * @param {Object} patient
 * @param {number} appointmentId
 * @param {string} [reason]
 * @returns {Promise<Object>}
 */
const cancelAppointment = async (patient, appointmentId, reason) => {
  const appointment = await appointmentRepository.findDetailedById(appointmentId);

  // Ownership: the appointment must belong to the caller.
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

  // Notify the professional (non-blocking).
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
 * Resolves the professional's user id for an appointment row.
 * @param {Object} appointment
 * @returns {Promise<number|null>}
 */
const appointmentProfessionalUserId = async (appointment) => {
  const { professionalRepository } = require('../repositories/professional.repository');
  const professional = await professionalRepository.findById(appointment.professional_id);
  return professional ? professional.user_id : null;
};

/**
 * Calendar view: appointments inside a month window (Part 4).
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
 * Lists the caller's symptoms with filters (category, dates, intensity).
 */
const listSymptoms = (patient, filters, options) =>
  symptomRepository.findAll({ ...filters, patientId: patient.id }, options);

/**
 * Gets one of the caller's own symptoms.
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
 * Registers a symptom — the core patient write operation (Part 4).
 * Notifies the assigned professional(s).
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
 * Updates one of the caller's own symptoms.
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
 * Soft-deletes one of the caller's own symptoms.
 * @param {Object} patient
 * @param {number} symptomId
 * @returns {Promise<void>}
 */
const deleteSymptom = async (patient, symptomId) => {
  await getSymptom(patient, symptomId); // ownership + existence
  await symptomRepository.softDelete(symptomId);
};

/** Lists the symptom category catalog. */
const listSymptomCategories = () => symptomRepository.findAllCategories();

/** Lists the caller's treatments (read-only, filter by status). */
const listTreatments = (patient, filters, options) =>
  treatmentRepository.findAll({ ...filters, patientId: patient.id }, options);

/** Lists the caller's prescriptions (read-only, filter by status). */
const listMedications = (patient, filters, options) =>
  medicationRepository.findPrescriptions({ ...filters, patientId: patient.id }, options);

/** Lists the caller's routine assignments (read-only). */
const listRoutines = (patient, filters, options) =>
  routineRepository.findAssignments({ ...filters, patientId: patient.id }, options);

/**
 * Lists observations explicitly marked visible to the patient.
 * Hidden observations are excluded at SQL level (Part 5).
 */
const listVisibleObservations = (patient, options) =>
  observationRepository.findAll(
    { patientId: patient.id, visibleToPatient: true },
    options
  );

/** Lists the professional(s) currently assigned to the caller. */
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
