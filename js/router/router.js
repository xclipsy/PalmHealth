/**
 * Custom SPA router built on the History API (no hash routing).
 *
 * Features: public/protected routes, role guards, dynamic params
 * (/professional/patient/:id), lazy-loaded views, redirects, 404
 * fallback and scroll restoration. No page reloads ever occur.
 *
 * A route definition:
 *   { path, load, guard? }
 *   - path:  '/services' or '/patient/appointments/:id'
 *   - load:  async () => module — lazy import returning { render, mount? }
 *   - guard: { requiresAuth: boolean, role?: 'PATIENT'|'PROFESSIONAL' }
 */

import { ROUTES } from '../constants/app.constants.js';
import { isAuthenticated, getUserRole, setRoute } from '../state/store.js';
import { getAppRoot, scrollToTop } from '../utils/dom.util.js';

/** @type {Array<{ pattern: RegExp, keys: string[], load: Function, guard?: Object }>} */
const routes = [];

/** @type {{ load: Function }|null} Fallback (404) route. */
let notFoundRoute = null;

/**
 * Compiles '/patient/appointments/:id' into a RegExp with param keys.
 * @param {string} path
 * @returns {{ pattern: RegExp, keys: string[] }}
 */
const compilePath = (path) => {
  const keys = [];
  const source = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { pattern: new RegExp(`^${source}/?$`), keys };
};

/**
 * Resolves where an authenticated user should land by role.
 * @returns {string}
 */
const roleHome = () =>
  getUserRole() === 'PROFESSIONAL' ? ROUTES.PROFESSIONAL_DASHBOARD : ROUTES.PATIENT_DASHBOARD;

/**
 * Applies the guard chain for a route. Returns a redirect path when
 * access is denied, or null when access is allowed.
 * @param {Object|undefined} guard
 * @returns {string|null}
 */
const applyGuard = (guard) => {
  if (!guard) return null;
  if (guard.requiresAuth && !isAuthenticated()) return ROUTES.LOGIN;
  if (guard.role && getUserRole() !== guard.role) return roleHome();
  // Guest-only pages (login/register) bounce authenticated users home.
  if (guard.guestOnly && isAuthenticated()) return roleHome();
  return null;
};

/** Renders the view module for the current URL into #app. */
const render = async () => {
  const path = window.location.pathname;
  setRoute(path);

  let matched = null;
  let params = {};

  for (const route of routes) {
    const result = route.pattern.exec(path);
    if (result) {
      matched = route;
      params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(result[i + 1])]));
      break;
    }
  }

  if (matched) {
    const redirect = applyGuard(matched.guard);
    if (redirect) {
      router.replace(redirect);
      return;
    }
  }

  const target = matched ?? notFoundRoute;
  if (!target) return;

  const root = getAppRoot();
  const module = await target.load();
  const query = Object.fromEntries(new URLSearchParams(window.location.search));

  root.innerHTML = module.render({ params, query });
  // Optional post-render hook: event wiring, async data, focus management.
  if (typeof module.mount === 'function') module.mount({ params, query });

  scrollToTop();
};

export const router = {
  /**
   * Registers a route with an optional guard.
   * @param {string} path
   * @param {Function} load - Lazy loader: () => import('...view.js')
   * @param {Object} [guard]
   */
  register(path, load, guard) {
    if (path === '*') {
      notFoundRoute = { load };
      return;
    }
    routes.push({ ...compilePath(path), load, guard });
  },

  /**
   * Navigates via pushState (adds a history entry).
   * @param {string} path
   */
  navigate(path) {
    if (path === window.location.pathname) return;
    window.history.pushState({}, '', path);
    render();
  },

  /**
   * Replaces the current history entry (used for guard redirects).
   * @param {string} path
   */
  replace(path) {
    window.history.replaceState({}, '', path);
    render();
  },

  /** Starts the router: link interception + popstate + first render. */
  start() {
    // Intercept every internal <a data-link> click for SPA navigation.
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[data-link]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      event.preventDefault();
      router.navigate(href);
    });

    window.addEventListener('popstate', render);
    render();
  },
};
