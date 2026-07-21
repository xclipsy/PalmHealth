/**
 * Constantes generales de la aplicación.
 *
 * Centraliza valores fijos para evitar datos repetidos en el código.
 */
/** User roles. Exactly two roles exist in the system — no admin. */
const USER_ROLES = Object.freeze({
  PATIENT: 'PATIENT',
  PROFESSIONAL: 'PROFESSIONAL',
});

/**
 * Estados de cuenta.
 *
 * Solo las cuentas activas pueden autenticarse.
 */
const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
});

/**
 * Estados del ciclo de vida de las citas.
 */
const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

/**
 * Estados del ciclo de vida de los tratamientos.
 */
const TREATMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
});

/**
 * Estados de asignación entre pacientes y profesionales.
 */
const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  INACTIVE: 'INACTIVE',
});

/**
 * Categorías de rutinas (Parte 7).
 */
const ROUTINE_TYPES = Object.freeze({
  EXERCISE: 'EXERCISE',
  NUTRITION: 'NUTRITION',
  LIFESTYLE: 'LIFESTYLE',
});

/**
 * Tipos de notificaciones (Parte 7).
 */
const NOTIFICATION_TYPES = Object.freeze({
  APPOINTMENT: 'APPOINTMENT',
  MEDICATION: 'MEDICATION',
  SYMPTOM: 'SYMPTOM',
  TREATMENT: 'TREATMENT',
  SYSTEM: 'SYSTEM',
});

/**
 * Estados clínicos mostrados en tarjetas de pacientes (Parte 5).
 */
const PATIENT_CONDITION = Object.freeze({
  STABLE: 'STABLE',
  MONITORING: 'MONITORING',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  TREATMENT_COMPLETED: 'TREATMENT_COMPLETED',
});

/**
 * Rango de intensidad de síntomas (Parte 4: escala de 1 a 10).
 */
const SYMPTOM_INTENSITY = Object.freeze({
  MIN: 1,
  MAX: 10,
});

/**
 * Valores de paginación por defecto para endpoints de listas (Parte 8).
 */
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

/**
 * Valores predeterminados de citas.
 *
 * Mantiene sincronizado el valor por defecto de la BD en 007_appointments.sql.
 */
const APPOINTMENT_DEFAULTS = Object.freeze({
  DURATION_MINUTES: 30,
});

module.exports = {
  USER_ROLES,
  USER_STATUS,
  APPOINTMENT_STATUS,
  TREATMENT_STATUS,
  ASSIGNMENT_STATUS,
  ROUTINE_TYPES,
  NOTIFICATION_TYPES,
  PATIENT_CONDITION,
  SYMPTOM_INTENSITY,
  PAGINATION,
  APPOINTMENT_DEFAULTS,
};
