/**
 * Public footer with brand, navigation and legal links.
 */

import { ROUTES } from '../constants/app.constants.js';

const COLUMNS = [
  {
    title: 'Plataforma',
    links: [
      { href: ROUTES.ABOUT, label: 'Sobre nosotros' },
      { href: ROUTES.SERVICES, label: 'Servicios' },
      { href: ROUTES.FAQ, label: 'Preguntas frecuentes' },
      { href: ROUTES.CONTACT, label: 'Contacto' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { href: ROUTES.LOGIN, label: 'Iniciar sesión' },
      { href: ROUTES.REGISTER_PATIENT, label: 'Registro de paciente' },
      { href: ROUTES.REGISTER_PROFESSIONAL, label: 'Registro profesional' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: ROUTES.PRIVACY, label: 'Política de privacidad' },
      { href: ROUTES.TERMS, label: 'Términos y condiciones' },
    ],
  },
];

/**
 * Renders the footer.
 * @returns {string}
 */
export const Footer = () => `
  <footer class="border-t border-black/5 bg-surface">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-3">
        <a href="${ROUTES.HOME}" data-link class="flex items-center gap-2" aria-label="Palm Health — Inicio">
          <img src="/src/assets/images/logo.png" alt="" class="h-12 w-auto" />
          <span class="text-lg font-bold text-primary-dark">Palm Health</span>
        </a>
        <p class="text-sm leading-relaxed text-muted">
          Tu salud, siempre al alcance de tu mano. Plataforma de seguimiento clínico remoto entre pacientes y profesionales.
        </p>
      </div>

      ${COLUMNS.map(
        (col) => `
        <nav aria-label="${col.title}">
          <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">${col.title}</h3>
          <ul class="flex flex-col gap-2">
            ${col.links
              .map((link) => `<li><a href="${link.href}" data-link class="text-sm text-muted hover:text-primary-dark">${link.label}</a></li>`)
              .join('')}
          </ul>
        </nav>`
      ).join('')}
    </div>

    <div class="border-t border-black/5 px-4 py-4">
      <p class="mx-auto max-w-6xl text-center text-xs text-muted">
        © ${new Date().getFullYear()} Palm Health. Todos los derechos reservados. Esta plataforma no sustituye la atención médica de urgencia.
      </p>
    </div>
  </footer>
`;
