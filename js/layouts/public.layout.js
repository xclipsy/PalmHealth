/**
 * Public layout: navbar + main content + footer.
 * Every public page renders inside this shell.
 */

import { Navbar, mountNavbar } from '../components/navbar.component.js';
import { Footer } from '../components/footer.component.js';

/**
 * Wraps page content in the public shell.
 * @param {string} content - Page HTML.
 * @returns {string}
 */
export const PublicLayout = (content) => `
  ${Navbar()}
  <main id="main-content" class="min-h-[60vh]">${content}</main>
  ${Footer()}
`;

/**
 * Post-render wiring for the public layout (mobile menu).
 */
export const mountPublicLayout = () => {
  mountNavbar();
};
