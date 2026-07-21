/**
 * Servicio de profesionales: contiene la lógica de negocio para todos los
 * endpoints de /api/professional/*.
 *
 * Modelo de propiedad (Partes 3 y 5): un profesional solo puede operar
 * sobre pacientes con una asignación ACTIVE. Las protecciones a nivel de
 * rutas verifican los IDs recibidos en la URL; este servicio vuelve a
 * validar la propiedad de los IDs enviados en el cuerpo de la solicitud
 * (por ejemplo, patientId de una nueva cita), garantizando la regla sin
 * importar de dónde provenga el ID.
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
 * Obtiene el ID de usuario de un paciente (destinatario de notificaciones).
 *
 * @param {number} patientId
 * @returns {Promise<number|null>}
 */
const patientUserId = async (patientId) => {
  const patient = await patientRepository.findById(patientId);
  return patient ? patient.user_id : null;
};

/**
 * Panel principal: citas del día, cantidad de pacientes asignados,
 * síntomas recientes de pacientes asignados, tratamientos activos y
 * contador de notificaciones no leídas.
 *
 * @param {Object} professional - Fila de req.professional.
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getDashboard = async (professional, userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

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
 * Perfil completo del profesional.
 *
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
 * Actualiza los campos del perfil que el profesional puede editar
 * (nunca la licencia).
 */
const updateProfile = async (professional, data) => {
  const updated = await professionalRepository.updateProfile(professional.id, data);
  if (!updated) {
    throw new NotFoundError('El perfil de profesional no existe.');
  }
  return updated;
};

/** Lista los pacientes asignados con búsqueda y paginación. */
const listPatients = (professional, filters, options) =>
  professionalRepository.findAssignedPatients(professional.id, filters, options);

/**
 * Detalle completo del paciente para la vista clínica.
 * El guard de ruta ya verificó la asignación.
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
 * Vincula un paciente al profesional mediante correo registrado.
 * Idempotente: revincular reactiva la asignación.
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
 * Actualiza el estado de la asignación (ej. COMPLETED al finalizar la atención).
 */
const updateAssignmentStatus = async (professional, patientId, status) => {
  const updated = await assignmentRepository.updateStatus(professional.id, patientId, status);
  if (!updated) {
    throw new NotFoundError('La vinculación con este paciente no existe.');
  }
  return updated;
};

/**
 * Lista las citas del profesional (agenda) con filtros.
 */
const listAppointments = (professional, filters, options) =>
  appointmentRepository.findAll({ ...filters, professionalId: professional.id }, options);

/**
 * Crea una cita para un paciente asignado.
 * Revalida la propiedad porque el patientId viene en el body.
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
 * Carga una cita y valida que pertenezca al profesional.
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

/**
 * Actualiza una cita propia (reprogramar, completar, notas).
 */
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

/**
 * Cancela una cita propia indicando el motivo.
 */
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

/**
 * Vista de calendario: citas del profesional en un rango mensual.
 */
const getCalendar = async (professional, year, month) => {
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
  const result = await appointmentRepository.findAll(
    { professionalId: professional.id, from, to },
    { limit: 100, offset: 0, sort: 'scheduled_at', order: 'asc' }
  );
  return result.rows;
};

/**
 * Lista los síntomas de un paciente asignado (guard de ruta validado).
 */
const listPatientSymptoms = (patientId, filters, options) =>
  symptomRepository.findAll({ ...filters, patientId }, options);

/**
 * Lista las observaciones del profesional, opcionalmente por paciente asignado.
 */
const listObservations = async (professional, filters, options) => {
  if (filters.patientId) {
    await assertAssigned(professional.id, filters.patientId);
  }
  return observationRepository.findAll(
    { ...filters, professionalId: professional.id },
    options
  );
};

/**
 * Crea una observación para un paciente asignado.
 */
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
 * Actualiza una observación. Solo el profesional autor puede editarla.
 * Retorna 403 para otros, aunque estén asignados al mismo paciente.
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

/**
 * Lista los tratamientos del profesional con filtros.
 */
const listTreatments = (professional, filters, options) =>
  treatmentRepository.findAll({ ...filters, professionalId: professional.id }, options);

/**
 * Crea un tratamiento para un paciente asignado (valida asignación en el body).
 */
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

/**
 * Actualiza un tratamiento propio (campos y/o cambio de estado).
 */
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

/**
 * Lista el catálogo de medicamentos con búsqueda opcional por nombre.
 */
const listMedicationCatalog = (search) => medicationRepository.findCatalog(search);

/**
 * Lista las recetas emitidas por el profesional.
 */
const listPrescriptions = (professional, filters, options) =>
  medicationRepository.findPrescriptions(
    { ...filters, professionalId: professional.id },
    options
  );

/**
 * Receta un medicamento del catálogo a un paciente asignado.
 */
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

/**
 * Actualiza una receta propia (dosis, horario, estado).
 */
const updatePrescription = async (professional, prescriptionId, data) => {
  const existing = await medicationRepository.findPrescriptionById(prescriptionId);
  if (!existing || existing.professional_id !== professional.id) {
    throw new NotFoundError('La receta no existe.');
  }
  return medicationRepository.updatePrescription(prescriptionId, data);
};

/**
 * Lista el catálogo de rutinas, opcionalmente filtrado por tipo.
 */
const listRoutineCatalog = (type) => routineRepository.findCatalog(type);

/**
 * Lista las asignaciones de rutinas realizadas por el profesional.
 */
const listRoutineAssignments = (professional, filters, options) =>
  routineRepository.findAssignments(
    { ...filters, professionalId: professional.id },
    options
  );

/**
 * Asigna una rutina del catálogo a un paciente asignado.
 */
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

/**
 * Actualiza una asignación de rutina propia (horario, estado).
 */
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
