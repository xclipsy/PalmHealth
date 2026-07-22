/**
 * Patient API service — thin wrappers over /api/patient/*.
 *
 * Views never call the api client directly for patient data; every
 * endpoint is mapped here 1:1 so URL strings live in one place.
 * All responses carry { message, data, pagination? }.
 */

import { api } from './api-client.js';

/* ------------------------------ Dashboard ------------------------- */

/** GET /patient/dashboard */
export const getDashboard = () => api.get('/patient/dashboard');

/* ------------------------------- Profile -------------------------- */

/** GET /patient/profile */
export const getProfile = () => api.get('/patient/profile');

/** PUT /patient/profile */
export const updateProfile = (data) => api.put('/patient/profile', data);

/* ----------------------------- Appointments ----------------------- */

/** GET /patient/appointments */
export const listAppointments = (query) => api.get('/patient/appointments', query);

/** PATCH /patient/appointments/:id/cancel */
export const cancelAppointment = (id, reason) =>
  api.patch(`/patient/appointments/${id}/cancel`, reason ? { reason } : {});

/* ------------------------------- Symptoms ------------------------- */

/** GET /patient/symptoms/categories */
export const listSymptomCategories = () => api.get('/patient/symptoms/categories');

/** GET /patient/symptoms */
export const listSymptoms = (query) => api.get('/patient/symptoms', query);

/** GET /patient/symptoms/:id */
export const getSymptom = (id) => api.get(`/patient/symptoms/${id}`);

/** POST /patient/symptoms */
export const createSymptom = (data) => api.post('/patient/symptoms', data);

/** PUT /patient/symptoms/:id */
export const updateSymptom = (id, data) => api.put(`/patient/symptoms/${id}`, data);

/** DELETE /patient/symptoms/:id */
export const deleteSymptom = (id) => api.delete(`/patient/symptoms/${id}`);

/* -------------------------- Read-only clinical -------------------- */

/** GET /patient/treatments */
export const listTreatments = (query) => api.get('/patient/treatments', query);

/** GET /patient/medications */
export const listMedications = (query) => api.get('/patient/medications', query);

/** GET /patient/routines */
export const listRoutines = (query) => api.get('/patient/routines', query);

/** GET /patient/observations */
export const listObservations = (query) => api.get('/patient/observations', query);

/** GET /patient/professionals */
export const getAssignedProfessionals = () => api.get('/patient/professionals');

/* ----------------------------- Notifications ---------------------- */

/** GET /patient/notifications */
export const listNotifications = (query) => api.get('/patient/notifications', query);

/** PATCH /patient/notifications/:id/read */
export const markNotificationRead = (id) => api.patch(`/patient/notifications/${id}/read`, {});

/** DELETE /patient/notifications/:id */
export const deleteNotification = (id) => api.delete(`/patient/notifications/${id}`);

/* ------------------------------- Settings ------------------------- */

/** GET /patient/settings */
export const getSettings = () => api.get('/patient/settings');

/** PUT /patient/settings */
export const updateSettings = (data) => api.put('/patient/settings', data);
