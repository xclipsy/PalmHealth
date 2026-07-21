/**
 * Professional layout — the reusable authenticated shell for every
 * /professional/* view (Part 5 navigation).
 *
 * Structure: fixed sidebar (desktop) / slide-in drawer (mobile),
 * topbar with breadcrumbs + notifications bell + user menu, content
 * area and a compact footer. Mirrors the patient layout so both
 * panels share the same interaction model.
 */

import { ROUTES } from '../constants/app.constants.js';
import { getState, clearAuth } from '../state/store.js';
import { escapeHtml } from '../utils/dom.util.js';
import { Avatar, Breadcrumbs, NotificationBadge } from '../components/ui.components.js';
import { router } from '../router/router.js';
import { listNotifications } from '../services/professional.service.js';

/** Sidebar navigation model: id must match the view's `active` key. */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', href: ROUTES.PROFESSIONAL_DASHBOARD, icon: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10' },
  { id: 'patients', label: 'Pacientes', href: ROUTES.PROFESSIONAL_PATIENTS, icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'appointments', label: 'Citas', href: ROUTES.PROFESSIONAL_APPOINTMENTS, icon: 'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z' },
  { id: 'calendar', label: 'Calendario', href: ROUTES.PROFESSIONAL_CALENDAR, icon: 'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM12 13v4M10 15h4' },
  { id: 'treatments', label: 'Tratamientos', href: ROUTES.PROFESSIONAL_TREATMENTS, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'medications', label: 'Medicación', href: ROUTES.PROFESSIONAL_MEDICATIONS, icon: 'M19.5 12.5l-7 7a4.95 4.95 0 01-7-7l7-7a4.95 4.95 0 017 7zM8.5 8.5l7 7' },
  { id: 'routines', label: 'Rutinas', href: ROUTES.PROFESSIONAL_ROUTINES, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'observations', label: 'Observaciones', href: ROUTES.PROFESSIONAL_OBSERVATIONS, icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z' },
];

/** Secondary nav (below divider). */
const SECONDARY_ITEMS = [
  { id: 'profile', label: 'Mi perfil', href: ROUTES.PROFESSIONAL_PROFILE, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'settings', label: 'Preferencias', href: ROUTES.PROFESSIONAL_SETTINGS, icon: 'M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572 1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 010-3.35 1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

/**
 * Renders one sidebar link.
 * @param {{ id: string, label: string, href: string, icon: string }} item
 * @param {string} active
 * @returns {string}
 */
const NavLink = (item, active) => {
  const isActive = item.id === active;
  return `
    <a href="${item.href}" data-link
      class="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive ? 'bg-primary/15 text-primary-dark' : 'text-muted hover:bg-black/5 hover:text-foreground'
      }"
      ${isActive ? 'aria-current="page"' : ''}>
      <svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <path d="${item.icon}" />
      </svg>
      <span>${escapeHtml(item.label)}</span>
    </a>
  `;
};

/**
 * Sidebar content (shared between desktop rail and mobile drawer).
 * @param {string} active
 * @returns {string}
 */
const SidebarContent = (active) => `
  <nav class="flex flex-1 flex-col gap-1" aria-label="Navegación del profesional">
    ${NAV_ITEMS.map((item) => NavLink(item, active)).join('')}
    <div class="my-3 border-t border-black/5" role="separator"></div>
    ${SECONDARY_ITEMS.map((item) => NavLink(item, active)).join('')}
  </nav>
`;

/**
 * Professional layout wrapper.
 * @param {{ active: string, breadcrumbs: Array<{label: string, href?: string}>, content: string }} props
 * @returns {string}
 */
export const ProfessionalLayout = ({ active, breadcrumbs, content }) => {
  const { user } = getState();
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Profesional';

  return `
    <div class="flex min-h-screen bg-background">
      <!-- Desktop sidebar -->
      <aside class="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-black/5 bg-surface px-4 py-6 lg:flex" aria-label="Barra lateral">
        <a href="${ROUTES.PROFESSIONAL_DASHBOARD}" data-link class="flex items-center gap-2 px-2" aria-label="Palm Health — Inicio del profesional">
          <img src="/src/assets/images/logo.png" alt="" class="h-9 w-auto" />
          <span class="text-lg font-bold text-primary-dark">Palm Health</span>
        </a>
        ${SidebarContent(active)}
        <p class="px-2 text-xs text-muted">Palm Health · Panel clínico</p>
      </aside>

      <!-- Mobile drawer (hidden until toggled) -->
      <div id="mobile-drawer" class="fixed inset-0 z-40 hidden lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <div id="mobile-drawer-backdrop" class="absolute inset-0 bg-black/40"></div>
        <aside class="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 overflow-y-auto bg-surface px-4 py-6 shadow-xl">
          <div class="flex items-center justify-between px-2">
            <span class="text-lg font-bold text-primary-dark">Palm Health</span>
            <button type="button" id="mobile-drawer-close" aria-label="Cerrar menú"
              class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-foreground">✕</button>
          </div>
          ${SidebarContent(active)}
        </aside>
      </div>

      <!-- Main column -->
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-black/5 bg-surface/95 backdrop-blur">
          <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div class="flex items-center gap-3">
              <button type="button" id="mobile-drawer-open" aria-label="Abrir menú de navegación"
                class="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-black/5 lg:hidden">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <div class="hidden sm:block">${Breadcrumbs({ items: breadcrumbs })}</div>
            </div>
            <div class="flex items-center gap-2">
              <a href="${ROUTES.PROFESSIONAL_NOTIFICATIONS}" data-link id="notifications-bell"
                class="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-black/5"
                aria-label="Notificaciones">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span id="bell-badge-slot">${NotificationBadge({ count: 0 })}</span>
              </a>
              <div class="relative">
                <button type="button" id="user-menu-button" aria-haspopup="true" aria-expanded="false"
                  class="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-black/5">
                  ${Avatar({ name: fullName, size: 'sm' })}
                  <span class="hidden max-w-32 truncate text-sm font-medium text-foreground sm:inline">${escapeHtml(fullName)}</span>
                  <svg class="h-4 w-4 text-muted" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div id="user-menu" class="absolute right-0 top-full z-40 mt-2 hidden w-56 rounded-2xl bg-surface p-2 shadow-lg ring-1 ring-black/5" role="menu">
                  <div class="border-b border-black/5 px-3 py-2">
                    <p class="truncate text-sm font-semibold text-foreground">${escapeHtml(fullName)}</p>
                    <p class="truncate text-xs text-muted">${escapeHtml(getState().user?.email || '')}</p>
                  </div>
                  <a href="${ROUTES.PROFESSIONAL_PROFILE}" data-link role="menuitem"
                    class="block rounded-xl px-3 py-2 text-sm text-foreground hover:bg-black/5">Mi perfil</a>
                  <a href="${ROUTES.PROFESSIONAL_SETTINGS}" data-link role="menuitem"
                    class="block rounded-xl px-3 py-2 text-sm text-foreground hover:bg-black/5">Preferencias</a>
                  <button type="button" id="logout-button" role="menuitem"
                    class="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-error hover:bg-error/10">Cerrar sesión</button>
                </div>
              </div>
            </div>
          </div>
          <div class="px-4 pb-3 sm:hidden">${Breadcrumbs({ items: breadcrumbs })}</div>
        </header>

        <main id="main-content" class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">${content}</main>

        <footer class="border-t border-black/5 px-6 py-4 text-center text-xs text-muted">
          Palm Health — Panel clínico profesional. La información mostrada es confidencial.
        </footer>
      </div>
    </div>
  `;
};

/**
 * Wires the layout interactions: mobile drawer, user menu, logout and
 * the async unread-notifications badge. Idempotent per render.
 */
export const mountProfessionalLayout = () => {
  /* Mobile drawer */
  const drawer = document.getElementById('mobile-drawer');
  const openButton = document.getElementById('mobile-drawer-open');
  const closeButton = document.getElementById('mobile-drawer-close');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (openButton && drawer) {
    openButton.addEventListener('click', () => drawer.classList.remove('hidden'));
    closeButton?.addEventListener('click', () => drawer.classList.add('hidden'));
    backdrop?.addEventListener('click', () => drawer.classList.add('hidden'));
  }

  /* User menu (click toggle + outside click + Escape) */
  const menuButton = document.getElementById('user-menu-button');
  const menu = document.getElementById('user-menu');
  if (menuButton && menu) {
    const closeMenu = () => {
      menu.classList.add('hidden');
      menuButton.setAttribute('aria-expanded', 'false');
    };
    menuButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden');
      menuButton.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#user-menu') && !event.target.closest('#user-menu-button')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /* Logout */
  document.getElementById('logout-button')?.addEventListener('click', () => {
    clearAuth();
    router.navigate(ROUTES.HOME);
  });

  /* Unread badge (non-blocking) */
  listNotifications({ unreadOnly: 'true', limit: 1 })
    .then(({ pagination }) => {
      const slot = document.getElementById('bell-badge-slot');
      if (slot && pagination) slot.innerHTML = NotificationBadge({ count: pagination.totalItems ?? pagination.total ?? 0 });
    })
    .catch(() => {
      /* Badge is decorative — never block the view on failure. */
    });
};
