// Constantes globales de la aplicación frontend.
export const USER_ROLES = Object.freeze({
  PATIENT: 'PATIENT',
  PROFESSIONAL: 'PROFESSIONAL',
});

export const ROUTES = Object.freeze({
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  HOW_IT_WORKS: '/how-it-works',
  TESTIMONIALS: '/testimonials',
  FAQ: '/faq',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/legal',
  LOGIN: '/login',
  REGISTER_PATIENT: '/register/patient',
  REGISTER_PROFESSIONAL: '/register/professional',
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_PROFILE: '/patient/profile',
  PATIENT_SYMPTOMS: '/patient/symptoms',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_TREATMENTS: '/patient/treatments',
  PATIENT_MEDICATIONS: '/patient/medications',
  PATIENT_ROUTINES: '/patient/routines',
  PATIENT_OBSERVATIONS: '/patient/observations',
  PATIENT_NOTIFICATIONS: '/patient/notifications',
  PATIENT_SETTINGS: '/patient/settings',
  PROFESSIONAL_DASHBOARD: '/professional/dashboard',
  PROFESSIONAL_PATIENTS: '/professional/patients',
  PROFESSIONAL_PATIENT_DETAIL: '/professional/patients/:id',
  PROFESSIONAL_APPOINTMENTS: '/professional/appointments',
  PROFESSIONAL_CALENDAR: '/professional/calendar',
  PROFESSIONAL_TREATMENTS: '/professional/treatments',
  PROFESSIONAL_MEDICATIONS: '/professional/medications',
  PROFESSIONAL_ROUTINES: '/professional/routines',
  PROFESSIONAL_OBSERVATIONS: '/professional/observations',
  PROFESSIONAL_NOTIFICATIONS: '/professional/notifications',
  PROFESSIONAL_PROFILE: '/professional/profile',
  PROFESSIONAL_SETTINGS: '/professional/settings',
  NOT_FOUND: '/404',
});

export const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
});

export const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const TREATMENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  SUSPENDED: 'SUSPENDED',
});

export const STATUS_LABELS = Object.freeze({
  SCHEDULED: 'Programada',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
});

export const NOTIFICATION_TYPE_LABELS = Object.freeze({
  APPOINTMENT: 'Cita',
  MEDICATION: 'Medicación',
  SYMPTOM: 'Síntoma',
  TREATMENT: 'Tratamiento',
  SYSTEM: 'Sistema',
});

export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'palm_health_token',
  USER: 'palm_health_user',
  THEME: 'palm_health_theme',
});

export const API_BASE_URL = '/api';
