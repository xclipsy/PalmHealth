/**
 * Public navigation bar (responsive with mobile menu).
 * Reacts to auth state: shows login/register or the user menu.
 */

import { ROUTES } from '../constants/app.constants.js';
import { isAuthenticated, getState } from '../state/store.js';
import { escapeHtml } from '../utils/dom.util.js';
import { Button, Avatar } from './ui.components.js';

const NAV_LINKS = [
  { href: ROUTES.HOME, label: 'Inicio' },
  { href: ROUTES.ABOUT, label: 'Nosotros' },
  { href: ROUTES.SERVICES, label: 'Servicios' },
  { href: ROUTES.FAQ, label: 'Preguntas' },
  { href: ROUTES.CONTACT, label: 'Contacto' },
];

/**
 * Renders the public navbar.
 * @returns {string}
 */
export const Navbar = () => {
  const { user, route } = getState();
  const authed = isAuthenticated();

  const links = NAV_LINKS.map(
    (link) => `
      <a href="${link.href}" data-link
        class="rounded-full px-4 py-2 text-sm font-medium transition-colors ${route === link.href ? 'bg-primary/15 text-primary-dark' : 'text-foreground hover:text-primary-dark'}"
        ${route === link.href ? 'aria-current="page"' : ''}>
        ${link.label}
      </a>`
  ).join('');

  const authArea = authed
    ? `
      <a href="${user.role === 'PROFESSIONAL' ? ROUTES.PROFESSIONAL_DASHBOARD : ROUTES.PATIENT_DASHBOARD}" data-link
        class="flex items-center gap-2 rounded-full py-1 pl-1 pr-4 ring-1 ring-black/10 hover:bg-primary/10">
        ${Avatar({ name: `${user.firstName || ''} ${user.lastName || ''}`, size: 'sm' })}
        <span class="text-sm font-medium text-foreground">Mi panel</span>
      </a>`
    : `
      ${Button({ label: 'Iniciar sesión', href: ROUTES.LOGIN, variant: 'ghost', size: 'sm' })}
      ${Button({ label: 'Crear cuenta', href: ROUTES.REGISTER_PATIENT, variant: 'primary', size: 'sm' })}`;

  return `
    <header class="sticky top-0 z-30 border-b border-black/5 bg-background/90 backdrop-blur">
      <nav aria-label="Navegación principal" class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="${ROUTES.HOME}" data-link class="flex items-center gap-2" aria-label="Palm Health — Inicio">
          <img src="/src/assets/images/logo.png" alt="" class="h-10 w-auto" />
          <span class="text-lg font-bold text-primary-dark">Palm Health</span>
        </a>

        <div class="hidden items-center gap-1 lg:flex">${links}</div>

        <div class="hidden items-center gap-2 lg:flex">${authArea}</div>

        <button type="button" id="mobile-menu-toggle" aria-expanded="false" aria-controls="mobile-menu"
          class="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-primary/10 lg:hidden">
          <span class="sr-only">Abrir menú</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </nav>

      <div id="mobile-menu" class="hidden border-t border-black/5 bg-background px-4 py-4 lg:hidden">
        <div class="flex flex-col gap-1">${links}</div>
        <div class="mt-4 flex flex-col gap-2 border-t border-black/5 pt-4">${authArea}</div>
      </div>
    </header>
  `;
};

/**
 * Wires the mobile menu toggle after render.
 */
export const mountNavbar = () => {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });
};
