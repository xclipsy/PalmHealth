/**
 * Centralized HTTP client for the Palm Health REST API.
 *
 * Every request goes through this module: it attaches the JWT,
 * parses the standardized { success, message, data, errors } envelope,
 * handles 401 (session expiry) globally and normalizes errors.
 * Components and views must NEVER call fetch directly.
 */

import { API_BASE_URL } from '../constants/app.constants.js';
import { getToken, clearAuth } from '../state/store.js';

/** Error thrown for any non-2xx API response. */
export class ApiError extends Error {
  /**
   * @param {string} message - Spanish, user-friendly message from the API.
   * @param {number} status - HTTP status code.
   * @param {Array<{field: string, message: string}>} errors - Field errors.
   */
  constructor(message, status, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Performs a request against the API.
 * @param {string} path - Path under /api (e.g. '/auth/login').
 * @param {{ method?: string, body?: Object, query?: Object }} options
 * @returns {Promise<{ message: string, data: any, pagination?: Object }>}
 * @throws {ApiError}
 */
const request = async (path, { method = 'GET', body, query } = {}) => {
  const url = new URL(API_BASE_URL + path, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', 0);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { success: false, message: 'Respuesta inesperada del servidor.', errors: [] };
  }

  if (!response.ok) {
    // Expired/invalid session: clear auth and notify the app shell so it
    // can redirect to login (handled in app.js to avoid circular imports).
    if (response.status === 401 && token) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('palm:session-expired'));
    }
    throw new ApiError(
      payload.message || 'Ocurrió un error inesperado.',
      response.status,
      payload.errors || []
    );
  }

  return {
    message: payload.message,
    data: payload.data,
    pagination: payload.pagination,
  };
};

/** Public HTTP verb helpers. */
export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
