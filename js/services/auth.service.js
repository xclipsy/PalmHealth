// Servicio de Autenticación y Gestión de Cuenta en el Cliente.
import { api } from './api-client.js';
import { setAuth, clearAuth } from '../state/store.js';

// Normaliza el objeto usuario retornado por la API.
const normalizeUser = (apiUser) => {
  const { profile, ...account } = apiUser || {};
  return { ...account, ...(profile || {}), id: account.id };
};

// Guarda la sesión en el estado global.
const storeSession = (data) => {
  const user = normalizeUser(data.user);
  setAuth({ token: data.token, user });
  return user;
};

// Inicia sesión.
export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return storeSession(data);
};

// Registra un paciente.
export const registerPatient = async (form) => {
  const { data } = await api.post('/auth/register/patient', form);
  return storeSession(data);
};

// Registra un profesional de la salud.
export const registerProfessional = async (form) => {
  const { data } = await api.post('/auth/register/professional', form);
  return storeSession(data);
};

// Cambia la contraseña del usuario autenticado.
export const changePassword = async ({ currentPassword, newPassword, newPasswordConfirmation }) => {
  const { message } = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
    newPasswordConfirmation,
  });
  return message;
};

// Elimina la cuenta del usuario autenticado.
export const deleteAccount = async () => {
  const { message } = await api.delete('/auth/account');
  clearAuth();
  return message;
};

// Cierra sesión.
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAuth();
  }
};
