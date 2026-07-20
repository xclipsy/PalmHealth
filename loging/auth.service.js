import { api } from './api-client.js';
import { setAuth, clearAuth } from '../state/store.js';

/**
 * Flattens the API user shape ({ id, email, role, profile: {...} })
 * into the flat client shape the UI consumes ({ firstName, ... }).
 * @param {Object} apiUser
 * @returns {Object} Normalized user.
 */
const normalizeUser = (apiUser) => {
  const { profile, ...account } = apiUser || {};
  return { ...account, ...(profile || {}), id: account.id };
};

/**
 * Stores a normalized session from an auth API response.
 * @param {{ token: string, user: Object }} data
 * @returns {Object} The normalized user.
 */
const storeSession = (data) => {
  const user = normalizeUser(data.user);
  setAuth({ token: data.token, user });
  return user;
};

/**
 * Logs a user in and stores the session.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<Object>} The authenticated user.
 */
export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return storeSession(data);
};

/**
 * Registers a patient account and stores the session.
 * @param {Object} form - Patient registration payload.
 * @returns {Promise<Object>} The created user.
 */
export const registerPatient = async (form) => {
  const { data } = await api.post('/auth/register/patient', form);
  return storeSession(data);
};

/**
 * Registers a professional account and stores the session.
 * @param {Object} form - Professional registration payload.
 * @returns {Promise<Object>} The created user.
 */
export const registerProfessional = async (form) => {
  const { data } = await api.post('/auth/register/professional', form);
  return storeSession(data);
};

/**
 * Requests a password reset link (MVP: simulated flow server-side).
 * @param {string} email
 * @returns {Promise<string>} Confirmation message.
 */
export const forgotPassword = async (email) => {
  const { message } = await api.post('/auth/forgot-password', { email });
  return message;
};

/**
 * Resets the password using a recovery token.
 * MVP: the backend does not expose this endpoint yet (the recovery
 * flow is simulated per the spec), so we resolve with a friendly
 * message. Swap for api.post('/auth/reset-password', form) later.
 * @param {Object} _form
 * @returns {Promise<string>} Confirmation message.
 */
export const resetPassword = async (_form) =>
  'Restablecimiento simulado en esta etapa. Usa tu contraseña actual para iniciar sesión.';

/**
 * Logs out: notifies the API (stateless) and clears the session.
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAuth();
  }
};
