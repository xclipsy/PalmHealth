/**
 * Lightweight global state manager (observer pattern).
 *
 * Holds: authenticated user, JWT, current route, theme, notifications
 * and app settings. No external libraries — a frozen API over a
 * private state object with subscription support.
 */

import { STORAGE_KEYS } from '../constants/app.constants.js';

/** @type {{ user: Object|null, token: string|null, route: string, theme: string, notifications: Array, settings: Object }} */
const state = {
  user: null,
  token: null,
  route: window.location.pathname,
  theme: 'light',
  notifications: [],
  settings: {},
};

/** @type {Set<(state: Object) => void>} */
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener(getState()));

/**
 * Returns a shallow copy of the current state (read-only usage).
 * @returns {Object}
 */
export const getState = () => ({ ...state });

/**
 * Subscribes to state changes.
 * @param {(state: Object) => void} listener
 * @returns {() => void} Unsubscribe function.
 */
export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Hydrates auth state from localStorage on boot.
 */
export const hydrateAuth = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (token && rawUser) {
    try {
      state.token = token;
      state.user = JSON.parse(rawUser);
    } catch {
      clearAuth();
    }
  }
};

/**
 * Stores the authenticated session (state + localStorage).
 * @param {{ token: string, user: Object }} session
 */
export const setAuth = ({ token, user }) => {
  state.token = token;
  state.user = user;
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  notify();
};

/**
 * Clears the session on logout or 401 responses.
 */
export const clearAuth = () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  notify();
};

/** @returns {boolean} */
export const isAuthenticated = () => Boolean(state.token && state.user);

/** @returns {string|null} Current user role or null. */
export const getUserRole = () => state.user?.role ?? null;

/** @returns {string|null} */
export const getToken = () => state.token;

/**
 * Tracks the current route in state (set by the router).
 * @param {string} route
 */
export const setRoute = (route) => {
  state.route = route;
  notify();
};
