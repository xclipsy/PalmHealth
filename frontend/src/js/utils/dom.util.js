/**
 * DOM utilities shared across views and components.
 * Centralizes escaping and event delegation so views stay declarative.
 */

/**
 * Escapes a string for safe interpolation inside HTML templates.
 * Every piece of user- or API-provided text MUST pass through this.
 * @param {unknown} value
 * @returns {string}
 */
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

/**
 * Attaches a delegated event listener on a root element.
 * Survives re-renders of inner HTML because the listener lives on root.
 * @param {HTMLElement} root
 * @param {string} eventType
 * @param {string} selector - CSS selector the target must match.
 * @param {(event: Event, matched: HTMLElement) => void} handler
 */
export const delegate = (root, eventType, selector, handler) => {
  root.addEventListener(eventType, (event) => {
    const matched = event.target.closest(selector);
    if (matched && root.contains(matched)) handler(event, matched);
  });
};

/**
 * Returns the SPA mount node.
 * @returns {HTMLElement}
 */
export const getAppRoot = () => document.getElementById('app');

/**
 * Smooth-scrolls to the top of the page (used on navigation).
 */
export const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'instant' });
