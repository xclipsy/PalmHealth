/**
 * Professional service — business logic for every /api/professional/*
 * endpoint.
 *
 * Ownership model (Parts 3, 5): a professional only operates on
 * patients with an ACTIVE assignment. Route-level guards check ids in
 * the URL; this service re-verifies ownership for ids arriving in
 * request bodies (e.g. patientId of a new appointment) so the rule
 * holds no matter where the id comes from.
 */

const { professionalRepository } = require('../repositories/professional.repository');
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
  AuthorizationError,
  BusinessRuleError,
} = require('../errors/app.errors');
const {
  APPOINTMENT_STATUS,
  TREATMENT_STATUS,
  NOTIFICATION_TYPES,
} = require('../constants/app.constants');

/**
 * Body-level ownership check: throws 403 unless the professional is
 * actively assigned to the patient.
 * @param {number} professionalId
 * @param {number} patientId
 * @returns {Promise<void>}
 */
const assertAssigned = async (professionalId, patientId) => {
  const assigned = await assignmentRepository.isProfessionalAssignedToPatient(
    professionalId,
    patientId
  );
  if (!assigned) {
    throw new AuthorizationError('No tienes permisos para acceder a este paciente.');
  }
};

/**
 * Resolves a patient's user id (notification target).
 * @param {number} patientId
 * @returns {Promise<number|null>}
 */
const patientUserId = async (patientId) => {
  const patient = await patientRepository.findById(patientId);
  return patient ? patient.user_id : null;
};

/**
 * Dashboard: today's appointments, assigned patients count, recent
 * symptoms of assigned patients, active treatments, unread count.
 * @param {Object} professional - req.professional row.
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getDashboard = async (professional, userId) => {
  const now = new Date();
  const startOfDay = new Date(now.getTime() - 14 * 60 * 60 * 1000);
  const endOfDay = new Date(now.getTime() + 14 * 60 * 60 * 1000);

  const [todayAppointments, patients, activeTreatments, unreadCount] = await Promise.all([
    appointmentRepository.findAll(
      {
        professionalId: professional.id,
        status: APPOINTMENT_STATUS.SCHEDULED,
        from: startOfDay.toISOString(),
        to: endOfDay.toISOString(),
      },
      { limit: 20, offset: 0, sort: 'scheduled_at', order: 'asc' }
    ),
    professionalRepository.findAssignedPatients(professional.id, {}, { limit: 1, offset: 0 }),
    treatmentRepository.findAll(
      { professionalId: professional.id, status: TREATMENT_STATUS.ACTIVE },
      { limit: 5, offset: 0 }
    ),
    notificationRepository.countUnread(userId),
  ]);

  return {
    todayAppointments: { items: todayAppointments.rows, total: todayAppointments.total },
    assignedPatients: patients.total,
    activeTreatments: { items: activeTreatments.rows, total: activeTreatments.total },
    unreadNotifications: unreadCount,
  };
};

/**
 * Full professional profile.
 * @param {Object} professional
 * @returns {Promise<Object>}
 */
const getProfile = async (professional) => {
  const profile = await professionalRepository.findById(professional.id);
  if (!profile) {
    throw new NotFoundError('El perfil de profesional no existe.');
  }
  return profile;
};

/**
 * Updates the professional-editable profile fields (never the license).
 */
const updateProfile = async (professional, data) => {
  const updated = await professionalRepository.updateProfile(professional.id, data);
  if (!updated) {
    throw new NotFoundError('El perfil de profesional no existe.');
  }
  return updated;
};

/** Lists assigned patients with search and pagination (Part 5). */
const listPatients = (professional, filters, options) =>
  professionalRepository.findAssignedPatients(professional.id, filters, options);

/**
 * Full patient detail for the clinical view. Route guard already
 * verified the assignment.
 * @param {number} patientId
 * @returns {Promise<Object>}
 */
const getPatientDetail = async (patientId) => {
  const patient = await patientRepository.findWithEmail(patientId);
  if (!patient) {
    throw new NotFoundError('El paciente no existe.');
  }
  return patient;
};

/**
 * Links a patient to the caller by registered email (medical linking
 * flow, Part 5). Idempotent: re-linking reactivates the assignment.
 * @param {Object} professional
 * @param {string} email
 * @returns {Promise<Object>}
 */
const linkPatientByEmail = async (professional, email) => {
  const patient = await patientRepository.findByEmail(email.toLowerCase());
  if (!patient) {
    throw new NotFoundError('No existe un paciente registrado con ese correo.');
  }

  const assignment = await assignmentRepository.createOrReactivate(
    professional.id,
    patient.id
  );

  await notificationService.emit({
    userId: patient.user_id,
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Nuevo profesional vinculado',
    message: `${professional.first_name} ${professional.last_name} ahora es tu profesional de salud.`,
    relatedEntity: 'assignment',
    relatedId: assignment.id,
  });

  return { assignment, patient: { id: patient.id, firstName: patient.first_name, lastName: patient.last_name } };
};

/**
 * Updates the assignment status (e.g. COMPLETED when care ends).
 */
const updateAssignmentStatus = async (professional, patientId, status) => {
  const updated = await assignmentRepository.updateStatus(professional.id, patientId, status);
  if (!updated) {
    throw new NotFoundError('La vinculación con este paciente no existe.');
  }
  return updated;
};

/** Lists the caller's appointments (agenda) with filters. */
const listAppointments = (professional, filters, options) =>
  appointmentRepository.findAll({ ...filters, professionalId: professional.id }, options);

/**
 * Creates an appointment for an assigned patient. Ownership is
 * re-checked here because patientId arrives in the body.
 */
const createAppointment = async (professional, data) => {
  await assertAssigned(professional.id, data.patientId);

  const appointment = await appointmentRepository.create({
    ...data,
    professionalId: professional.id,
  });

  const targetUser = await patientUserId(data.patientId);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      title: 'Nueva cita programada',
      message: `Tienes una nueva cita con ${professional.first_name} ${professional.last_name}.`,
      relatedEntity: 'appointment',
      relatedId: appointment.id,
    });
  }

  return appointment;
};

/**
 * Loads an appointment and asserts the caller owns it.
 * @param {Object} professional
 * @param {number} appointmentId
 * @returns {Promise<Object>}
 */
const getOwnedAppointment = async (professional, appointmentId) => {
  const appointment = await appointmentRepository.findDetailedById(appointmentId);
  if (!appointment || appointment.professional_id !== professional.id) {
    throw new NotFoundError('La cita no existe.');
  }
  return appointment;
};

/** Updates an owned appointment (reschedule, complete, notes). */
const updateAppointment = async (professional, appointmentId, data) => {
  const existing = await getOwnedAppointment(professional, appointmentId);

  if (existing.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new BusinessRuleError('No se puede modificar una cita cancelada.');
  }

  const updated = await appointmentRepository.update(appointmentId, data);

  const targetUser = await patientUserId(existing.patient_id);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      title: 'Cita actualizada',
      message: 'Una de tus citas fue actualizada por tu profesional de salud.',
      relatedEntity: 'appointment',
      relatedId: appointmentId,
    });
  }

  return updated;
};

/** Cancels an owned appointment with a reason. */
const cancelAppointment = async (professional, appointmentId, reason) => {
  const existing = await getOwnedAppointment(professional, appointmentId);

  if (existing.status !== APPOINTMENT_STATUS.SCHEDULED) {
    throw new BusinessRuleError('Solo se pueden cancelar citas programadas.');
  }

  const cancelled = await appointmentRepository.cancel(
    appointmentId,
    APPOINTMENT_STATUS.CANCELLED,
    reason
  );

  const targetUser = await patientUserId(existing.patient_id);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      title: 'Cita cancelada',
      message: 'Una de tus citas fue cancelada por tu profesional de salud.',
      relatedEntity: 'appointment',
      relatedId: appointmentId,
    });
  }

  return cancelled;
};

/** Calendar view: the caller's appointments in a month window. */
const getCalendar = async (professional, year, month) => {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
  const result = await appointmentRepository.findAll(
    { professionalId: professional.id, from, to },
    { limit: 100, offset: 0, sort: 'scheduled_at', order: 'asc' }
  );
  return result.rows;
};

/** Lists an assigned patient's symptoms (route guard checked the id). */
const listPatientSymptoms = (patientId, filters, options) =>
  symptomRepository.findAll({ ...filters, patientId }, options);

/** Lists the caller's observations, optionally per assigned patient. */
const listObservations = async (professional, filters, options) => {
  if (filters.patientId) {
    await assertAssigned(professional.id, filters.patientId);
  }
  return observationRepository.findAll(
    { ...filters, professionalId: professional.id },
    options
  );
};

/** Creates an observation for an assigned patient. */
const createObservation = async (professional, data) => {
  await assertAssigned(professional.id, data.patientId);

  const observation = await observationRepository.create({
    ...data,
    professionalId: professional.id,
  });

  if (observation.visible_to_patient) {
    const targetUser = await patientUserId(data.patientId);
    if (targetUser) {
      await notificationService.emit({
        userId: targetUser,
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Nueva observación disponible',
        message: 'Tu profesional de salud compartió una observación contigo.',
        relatedEntity: 'observation',
        relatedId: observation.id,
      });
    }
  }

  return observation;
};

/**
 * Updates an observation. Only the authoring professional may edit
 * (Part 5) — others get 403 even if assigned to the same patient.
 */
const updateObservation = async (professional, observationId, data) => {
  const existing = await observationRepository.findDetailedById(observationId);
  if (!existing) {
    throw new NotFoundError('La observación no existe.');
  }
  if (existing.professional_id !== professional.id) {
    throw new AuthorizationError('Solo el autor puede modificar esta observación.');
  }
  return observationRepository.update(observationId, data);
};

/** Lists the caller's treatments with filters. */
const listTreatments = (professional, filters, options) =>
  treatmentRepository.findAll({ ...filters, professionalId: professional.id }, options);

/** Creates a treatment for an assigned patient (body-level ownership). */
const createTreatment = async (professional, data) => {
  await assertAssigned(professional.id, data.patientId);

  const treatment = await treatmentRepository.create({
    ...data,
    professionalId: professional.id,
  });

  const targetUser = await patientUserId(data.patientId);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.TREATMENT,
      title: 'Nuevo tratamiento asignado',
      message: `Se te asignó el tratamiento: ${data.title}.`,
      relatedEntity: 'treatment',
      relatedId: treatment.id,
    });
  }

  return treatment;
};

/** Updates an owned treatment (fields and/or status transition). */
const updateTreatment = async (professional, treatmentId, data) => {
  const existing = await treatmentRepository.findDetailedById(treatmentId);
  if (!existing || existing.professional_id !== professional.id) {
    throw new NotFoundError('El tratamiento no existe.');
  }

  const updated = await treatmentRepository.update(treatmentId, data);

  if (data.status && data.status !== existing.status) {
    const targetUser = await patientUserId(existing.patient_id);
    if (targetUser) {
      await notificationService.emit({
        userId: targetUser,
        type: NOTIFICATION_TYPES.TREATMENT,
        title: 'Tratamiento actualizado',
        message: `El estado de tu tratamiento "${existing.title}" cambió.`,
        relatedEntity: 'treatment',
        relatedId: treatmentId,
      });
    }
  }

  return updated;
};

/** Lists the medication catalog with optional name search. */
const listMedicationCatalog = (search) => medicationRepository.findCatalog(search);

/** Lists prescriptions written by the caller. */
const listPrescriptions = (professional, filters, options) =>
  medicationRepository.findPrescriptions(
    { ...filters, professionalId: professional.id },
    options
  );

/** Prescribes a catalog medication to an assigned patient. */
const createPrescription = async (professional, data) => {
  await assertAssigned(professional.id, data.patientId);

  const exists = await medicationRepository.medicationExists(data.medicationId);
  if (!exists) {
    throw new NotFoundError('El medicamento no existe en el catálogo.');
  }

  const prescription = await medicationRepository.createPrescription({
    ...data,
    professionalId: professional.id,
  });

  const targetUser = await patientUserId(data.patientId);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.MEDICATION,
      title: 'Nuevo medicamento asignado',
      message: `Se te recetó un medicamento: ${data.dosage}, ${data.frequency}.`,
      relatedEntity: 'patient_medication',
      relatedId: prescription.id,
    });
  }

  return prescription;
};

/** Updates an owned prescription (dosage, schedule, status). */
const updatePrescription = async (professional, prescriptionId, data) => {
  const existing = await medicationRepository.findPrescriptionById(prescriptionId);
  if (!existing || existing.professional_id !== professional.id) {
    throw new NotFoundError('La receta no existe.');
  }
  return medicationRepository.updatePrescription(prescriptionId, data);
};

/** Lists the routine catalog, optionally filtered by type. */
const listRoutineCatalog = (type) => routineRepository.findCatalog(type);

/** Lists routine assignments made by the caller. */
const listRoutineAssignments = (professional, filters, options) =>
  routineRepository.findAssignments(
    { ...filters, professionalId: professional.id },
    options
  );

/** Assigns a catalog routine to an assigned patient. */
const createRoutineAssignment = async (professional, data) => {
  await assertAssigned(professional.id, data.patientId);

  const exists = await routineRepository.routineExists(data.routineId);
  if (!exists) {
    throw new NotFoundError('La rutina no existe en el catálogo.');
  }

  const assignment = await routineRepository.createAssignment({
    ...data,
    professionalId: professional.id,
  });

  const targetUser = await patientUserId(data.patientId);
  if (targetUser) {
    await notificationService.emit({
      userId: targetUser,
      type: NOTIFICATION_TYPES.TREATMENT,
      title: 'Nueva rutina asignada',
      message: `Se te asignó una rutina: ${data.schedule}.`,
      relatedEntity: 'patient_routine',
      relatedId: assignment.id,
    });
  }

  return assignment;
};

/** Updates an owned routine assignment (schedule, status). */
const updateRoutineAssignment = async (professional, assignmentId, data) => {
  const existing = await routineRepository.findAssignmentById(assignmentId);
  if (!existing || existing.professional_id !== professional.id) {
    throw new NotFoundError('La rutina asignada no existe.');
  }
  return routineRepository.updateAssignment(assignmentId, data);
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  listPatients,
  getPatientDetail,
  linkPatientByEmail,
  updateAssignmentStatus,
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getCalendar,
  listPatientSymptoms,
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
};
