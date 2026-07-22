/**
 * Professional API service — thin wrappers over /api/professional/*.
 *
 * Views never call the api client directly for professional data;
 * every endpoint is mapped here 1:1 so URL strings live in one place.
 * All responses carry { message, data, pagination? }.
 */

import { api } from './api-client.js';

/* ------------------------------ Dashboard ------------------------- */

/** GET /professional/dashboard */
export const getDashboard = () => api.get('/professional/dashboard');

/* ------------------------------- Profile -------------------------- */

/** GET /professional/profile */
export const getProfile = () => api.get('/professional/profile');

/** PUT /professional/profile */
export const updateProfile = (data) => api.put('/professional/profile', data);

/* ------------------------------- Patients ------------------------- */

/** GET /professional/patients */
export const listPatients = (query) => api.get('/professional/patients', query);

/** POST /professional/patients/link */
export const linkPatient = (email) => api.post('/professional/patients/link', { email });

/** GET /professional/patients/:id */
export const getPatientDetail = (id) => api.get(`/professional/patients/${id}`);

/** PATCH /professional/patients/:id/assignment */
export const updateAssignment = (id, status) =>
  api.patch(`/professional/patients/${id}/assignment`, { status });

/** GET /professional/patients/:id/symptoms */
export const listPatientSymptoms = (id, query) =>
  api.get(`/professional/patients/${id}/symptoms`, query);

/* ----------------------------- Appointments ----------------------- */

/** GET /professional/appointments */
export const listAppointments = (query) => api.get('/professional/appointments', query);

/** POST /professional/appointments */
export const createAppointment = (data) => api.post('/professional/appointments', data);

/** PUT /professional/appointments/:id */
export const updateAppointment = (id, data) =>
  api.put(`/professional/appointments/${id}`, data);

/** PATCH /professional/appointments/:id/cancel */
export const cancelAppointment = (id, reason) =>
  api.patch(`/professional/appointments/${id}/cancel`, reason ? { reason } : {});

/** GET /professional/calendar?year=&month= */
export const getCalendar = (year, month) =>
  api.get('/professional/calendar', { year, month });

/* ----------------------------- Observations ----------------------- */

/** GET /professional/observations */
export const listObservations = (query) => api.get('/professional/observations', query);

/** POST /professional/observations */
export const createObservation = (data) => api.post('/professional/observations', data);

/** PUT /professional/observations/:id */
export const updateObservation = (id, data) =>
  api.put(`/professional/observations/${id}`, data);

/* ------------------------------ Treatments ------------------------ */

/** GET /professional/treatments */
export const listTreatments = (query) => api.get('/professional/treatments', query);

/** POST /professional/treatments */
export const createTreatment = (data) => api.post('/professional/treatments', data);

/** PUT /professional/treatments/:id */
export const updateTreatment = (id, data) => api.put(`/professional/treatments/${id}`, data);

/* ------------------------------ Medications ----------------------- */

/** GET /professional/medications/catalog */
export const listMedicationCatalog = (search) =>
  api.get('/professional/medications/catalog', search ? { search } : undefined);

/** GET /professional/medications */
export const listPrescriptions = (query) => api.get('/professional/medications', query);

/** POST /professional/medications */
export const createPrescription = (data) => api.post('/professional/medications', data);

/** PUT /professional/medications/:id */
export const updatePrescription = (id, data) =>
  api.put(`/professional/medications/${id}`, data);

/* ------------------------------- Routines ------------------------- */

/** GET /professional/routines/catalog */
export const listRoutineCatalog = (type) =>
  api.get('/professional/routines/catalog', type ? { type } : undefined);

/** GET /professional/routines */
export const listRoutineAssignments = (query) => api.get('/professional/routines', query);

/** POST /professional/routines */
export const createRoutineAssignment = (data) => api.post('/professional/routines', data);

/** PUT /professional/routines/:id */
export const updateRoutineAssignment = (id, data) =>
  api.put(`/professional/routines/${id}`, data);

/* ----------------------------- Notifications ---------------------- */

/** GET /professional/notifications */
export const listNotifications = (query) => api.get('/professional/notifications', query);

/** PATCH /professional/notifications/:id/read */
export const markNotificationRead = (id) =>
  api.patch(`/professional/notifications/${id}/read`, {});

/** DELETE /professional/notifications/:id */
export const deleteNotification = (id) => api.delete(`/professional/notifications/${id}`);

/* ------------------------------- Settings ------------------------- */

/** GET /professional/settings */
export const getSettings = () => api.get('/professional/settings');

/** PUT /professional/settings */
export const updateSettings = (data) => api.put('/professional/settings', data);
