/**
 * Application-wide constants.
 *
 * No magic numbers or magic strings in business code — every fixed
 * domain value is declared here (Part 10 of the specification).
 */

/** User roles. Exactly two roles exist in the system — no admin. */
const USER_ROLES = Object.freeze({
  PATIENT: 'PATIENT',
  PROFESSIONAL: 'PROFESSIONAL',
});

/** Account states. Only ACTIVE accounts can authenticate. */
const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
});

/** Appointment lifecycle states. */
const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

/** Treatment lifecycle states. */
const TREATMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
});

/** Patient ⇄ professional assignment states (Part 7). */
const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  INACTIVE: 'INACTIVE',
});

/** Routine categories (Part 7). */
const ROUTINE_TYPES = Object.freeze({
  EXERCISE: 'EXERCISE',
  NUTRITION: 'NUTRITION',
  LIFESTYLE: 'LIFESTYLE',
});

/** Notification types (Part 7). */
const NOTIFICATION_TYPES = Object.freeze({
  APPOINTMENT: 'APPOINTMENT',
  MEDICATION: 'MEDICATION',
  SYMPTOM: 'SYMPTOM',
  TREATMENT: 'TREATMENT',
  SYSTEM: 'SYSTEM',
});

/** Clinical status badges shown on patient cards (Part 5). */
const PATIENT_CONDITION = Object.freeze({
  STABLE: 'STABLE',
  MONITORING: 'MONITORING',
  NEEDS_ATTENTION: 'NEEDS_ATTENTION',
  TREATMENT_COMPLETED: 'TREATMENT_COMPLETED',
});

/** Symptom intensity bounds (Part 4: scale of 1 to 10). */
const SYMPTOM_INTENSITY = Object.freeze({
  MIN: 1,
  MAX: 10,
});

/** Default pagination values for list endpoints (Part 8). */
const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

/** Appointment defaults — mirrors the DB default in 007_appointments.sql. */
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
