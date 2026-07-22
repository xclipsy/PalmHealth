/**
 * SPA bootstrap entry point.
 *
 * Responsibility: wait for the DOM and start the application.
 * All application wiring (router, state, layouts) lives in app.js.
 */

import { startApp } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  startApp();
});
