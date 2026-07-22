// Inicialización de la SPA y registro de rutas.
import { router } from './router/router.js';
import { hydrateAuth } from './state/store.js';
import { ROUTES, USER_ROLES } from './constants/app.constants.js';
import { showToast } from './components/feedback.components.js';

export const startApp = () => {
  hydrateAuth();

  // Escucha expiración de sesión.
  window.addEventListener('palm:session-expired', () => {
    showToast('Tu sesión ha expirado. Inicia sesión nuevamente.', 'error');
    router.replace(ROUTES.LOGIN);
  });

  // Rutas Públicas
  router.register(ROUTES.HOME, () => import('./views/public/home.view.js'));
  router.register(ROUTES.ABOUT, () => import('./views/public/about.view.js'));
  router.register(ROUTES.SERVICES, () => import('./views/public/services.view.js'));
  router.register(ROUTES.FAQ, () => import('./views/public/faq.view.js'));
  router.register(ROUTES.CONTACT, () => import('./views/public/contact.view.js'));
  router.register(ROUTES.PRIVACY, () => import('./views/public/privacy.view.js'));
  router.register(ROUTES.TERMS, () => import('./views/public/terms.view.js'));

  // Rutas de Invitado (Solo si no ha iniciado sesión)
  const guestOnly = { guestOnly: true };
  router.register(ROUTES.LOGIN, () => import('./views/auth/login.view.js'), guestOnly);
  router.register(ROUTES.REGISTER_PATIENT, () => import('./views/auth/register.view.js'), guestOnly);
  router.register(ROUTES.REGISTER_PROFESSIONAL, () => import('./views/auth/register.view.js'), guestOnly);

  // Rutas Protegidas - Paciente
  const patientOnly = { requiresAuth: true, role: USER_ROLES.PATIENT };

  router.register(ROUTES.PATIENT_DASHBOARD, () => import('./views/patient/home.view.js'), patientOnly);
  router.register(ROUTES.PATIENT_PROFILE, () => import('./views/patient/profile.view.js'), patientOnly);
  router.register(ROUTES.PATIENT_SYMPTOMS, () => import('./views/patient/symptoms.view.js'), patientOnly);
  router.register(ROUTES.PATIENT_APPOINTMENTS, () => import('./views/patient/appointments.view.js'), patientOnly);
  router.register(ROUTES.PATIENT_NOTIFICATIONS, () => import('./views/patient/notifications.view.js'), patientOnly);
  router.register(ROUTES.PATIENT_SETTINGS, () => import('./views/patient/settings.view.js'), patientOnly);

  const clinicalView = (renderKey, mountKey) => async () => {
    const mod = await import('./views/patient/clinical.view.js');
    return { render: mod[renderKey], mount: mod[mountKey] };
  };
  router.register(ROUTES.PATIENT_TREATMENTS, clinicalView('renderTreatments', 'mountTreatments'), patientOnly);
  router.register(ROUTES.PATIENT_MEDICATIONS, clinicalView('renderMedications', 'mountMedications'), patientOnly);
  router.register(ROUTES.PATIENT_ROUTINES, clinicalView('renderRoutines', 'mountRoutines'), patientOnly);
  router.register(ROUTES.PATIENT_OBSERVATIONS, clinicalView('renderObservations', 'mountObservations'), patientOnly);

  // Rutas Protegidas - Profesional de la Salud
  const professionalOnly = { requiresAuth: true, role: USER_ROLES.PROFESSIONAL };

  router.register(ROUTES.PROFESSIONAL_DASHBOARD, () => import('./views/professional/home.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_PATIENTS, () => import('./views/professional/patients.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_PATIENT_DETAIL, () => import('./views/professional/patient-detail.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_APPOINTMENTS, () => import('./views/professional/appointments.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_CALENDAR, () => import('./views/professional/calendar.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_NOTIFICATIONS, () => import('./views/professional/notifications.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_PROFILE, () => import('./views/professional/profile.view.js'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_SETTINGS, () => import('./views/professional/settings.view.js'), professionalOnly);

  const professionalClinical = (renderKey, mountKey) => async () => {
    const mod = await import('./views/professional/clinical.view.js');
    return { render: mod[renderKey], mount: mod[mountKey] };
  };
  router.register(ROUTES.PROFESSIONAL_TREATMENTS, professionalClinical('renderTreatments', 'mountTreatments'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_MEDICATIONS, professionalClinical('renderMedications', 'mountMedications'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_ROUTINES, professionalClinical('renderRoutines', 'mountRoutines'), professionalOnly);
  router.register(ROUTES.PROFESSIONAL_OBSERVATIONS, professionalClinical('renderObservations', 'mountObservations'), professionalOnly);

  // Ruta 404
  router.register('*', () => import('./views/public/not-found.view.js'));

  router.start();
};
