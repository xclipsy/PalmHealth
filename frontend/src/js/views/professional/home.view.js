/**
 * Professional home — /professional/dashboard (Part 5).
 *
 * Composes: welcome header, KPI stat cards, today's agenda, upcoming
 * appointments, active treatments, weekly activity overview, recent
 * notifications and quick actions. All data loads in parallel after
 * the skeleton renders.
 */

import { ROUTES, NOTIFICATION_TYPE_LABELS } from '../../constants/app.constants.js';
import { getState } from '../../state/store.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, formatRelative, StatusBadge } from '../../utils/format.util.js';
import { Card } from '../../components/ui.components.js';
import { Skeleton, EmptyState, ErrorState } from '../../components/feedback.components.js';
import {
  ProfessionalLayout,
  mountProfessionalLayout,
} from '../../layouts/professional.layout.js';
import {
  getDashboard,
  listAppointments,
  listNotifications,
} from '../../services/professional.service.js';

/** Stat card with icon, label and value. */
const StatCard = ({ label, value, href, icon }) => `
  <a href="${href}" data-link
    class="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md">
    <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-dark">
      <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}"/></svg>
    </span>
    <span class="flex flex-col">
      <span class="text-2xl font-bold text-foreground" data-stat="${label}">${value}</span>
      <span class="text-sm text-muted">${escapeHtml(label)}</span>
    </span>
  </a>
`;

/** One agenda row (appointment with patient name). */
const AgendaRow = (appointment) => `
  <li class="flex flex-wrap items-center justify-between gap-3 py-3">
    <div class="flex min-w-0 flex-col">
      <p class="truncate text-sm font-semibold text-foreground">
        ${escapeHtml(`${appointment.patient_first_name} ${appointment.patient_last_name}`)}
      </p>
      <p class="truncate text-xs text-muted">${escapeHtml(appointment.reason || '')}</p>
      <p class="text-xs text-muted">${formatDateTime(appointment.scheduled_at)}</p>
    </div>
    ${StatusBadge(appointment.status)}
  </li>
`;

/** Quick action button. */
const QuickAction = ({ label, href }) => `
  <a href="${href}" data-link
    class="rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary-dark transition-colors hover:bg-primary/20">
    ${escapeHtml(label)}
  </a>
`;

/**
 * Weekly activity bars: appointments per weekday of the current week.
 * @param {Array} appointments - This week's appointments.
 * @returns {string}
 */
const WeeklyOverview = (appointments) => {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  appointments.forEach((appointment) => {
    const day = new Date(appointment.scheduled_at).getDay();
    counts[(day + 6) % 7] += 1; // getDay(): 0=Sunday -> index 6
  });
  const max = Math.max(1, ...counts);
  return `
    <div class="flex items-end justify-between gap-2" role="img"
      aria-label="Actividad semanal: ${counts.reduce((a, b) => a + b, 0)} citas esta semana">
      ${counts
        .map(
          (count, i) => `
        <div class="flex flex-1 flex-col items-center gap-1.5">
          <span class="text-xs font-semibold text-foreground">${count || ''}</span>
          <div class="w-full rounded-t-lg bg-primary/70" style="height: ${Math.max(6, (count / max) * 72)}px"></div>
          <span class="text-xs text-muted">${labels[i]}</span>
        </div>`
        )
        .join('')}
    </div>
  `;
};

/** Section wrapper with heading + optional "view all" link. */
const Section = ({ title, href, content }) => `
  <section class="flex flex-col gap-3" aria-label="${escapeHtml(title)}">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-foreground">${escapeHtml(title)}</h2>
      ${href ? `<a href="${href}" data-link class="text-sm font-medium text-primary-dark hover:underline">Ver todo</a>` : ''}
    </div>
    ${content}
  </section>
`;

export const render = () => {
  const { user } = getState();
  const firstName = user?.firstName || 'Profesional';

  return ProfessionalLayout({
    active: 'dashboard',
    breadcrumbs: [{ label: 'Inicio' }],
    content: `
      <div class="flex flex-col gap-8">
        <header>
          <h1 class="text-2xl font-bold text-balance text-foreground">Bienvenido, ${escapeHtml(firstName)}</h1>
          <p class="mt-1 text-sm text-muted">Este es el resumen de tu actividad clínica.</p>
        </header>

        <div id="dash-stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          ${Card({ content: Skeleton({ lines: 2 }) })}
          ${Card({ content: Skeleton({ lines: 2 }) })}
          ${Card({ content: Skeleton({ lines: 2 }) })}
          ${Card({ content: Skeleton({ lines: 2 }) })}
        </div>

        ${Section({
          title: 'Acciones rápidas',
          content: `
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              ${QuickAction({ label: 'Vincular paciente', href: `${ROUTES.PROFESSIONAL_PATIENTS}?link=1` })}
              ${QuickAction({ label: 'Nueva cita', href: `${ROUTES.PROFESSIONAL_APPOINTMENTS}?new=1` })}
              ${QuickAction({ label: 'Nuevo tratamiento', href: `${ROUTES.PROFESSIONAL_TREATMENTS}?new=1` })}
              ${QuickAction({ label: 'Nueva observación', href: `${ROUTES.PROFESSIONAL_OBSERVATIONS}?new=1` })}
            </div>
          `,
        })}

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          ${Section({
            title: 'Citas de hoy',
            href: ROUTES.PROFESSIONAL_APPOINTMENTS,
            content: `<div id="dash-today">${Card({ content: Skeleton({ lines: 4 }) })}</div>`,
          })}
          ${Section({
            title: 'Próximas citas',
            href: ROUTES.PROFESSIONAL_APPOINTMENTS,
            content: `<div id="dash-upcoming">${Card({ content: Skeleton({ lines: 4 }) })}</div>`,
          })}
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          ${Section({
            title: 'Actividad semanal',
            href: ROUTES.PROFESSIONAL_CALENDAR,
            content: `<div id="dash-weekly">${Card({ content: Skeleton({ lines: 4 }) })}</div>`,
          })}
          ${Section({
            title: 'Notificaciones recientes',
            href: ROUTES.PROFESSIONAL_NOTIFICATIONS,
            content: `<div id="dash-notifications">${Card({ content: Skeleton({ lines: 4 }) })}</div>`,
          })}
        </div>
      </div>
    `,
  });
};

export const mount = () => {
  mountProfessionalLayout();

  const statsNode = document.getElementById('dash-stats');
  const todayNode = document.getElementById('dash-today');
  const upcomingNode = document.getElementById('dash-upcoming');
  const weeklyNode = document.getElementById('dash-weekly');
  const notificationsNode = document.getElementById('dash-notifications');

  /* Week window (Monday..Sunday) for the weekly overview. */
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  Promise.all([
    getDashboard(),
    listAppointments({
      status: 'SCHEDULED',
      from: new Date().toISOString(),
      limit: 5,
      sort: 'scheduled_at',
      order: 'asc',
    }),
    listAppointments({ from: monday.toISOString(), to: sunday.toISOString(), limit: 100 }),
    listNotifications({ limit: 5 }),
  ])
    .then(([dashboard, upcoming, weekly, notifications]) => {
      const { todayAppointments, assignedPatients, activeTreatments, unreadNotifications } =
        dashboard.data;

      const todayDateString = new Date().toDateString();
      const todayItems = todayAppointments.items.filter(
        (app) => new Date(app.scheduled_at).toDateString() === todayDateString
      );

      statsNode.innerHTML = [
        StatCard({
          label: 'Pacientes asignados',
          value: assignedPatients,
          href: ROUTES.PROFESSIONAL_PATIENTS,
          icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z',
        }),
        StatCard({
          label: 'Citas hoy',
          value: todayItems.length,
          href: ROUTES.PROFESSIONAL_APPOINTMENTS,
          icon: 'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
        }),
        StatCard({
          label: 'Tratamientos activos',
          value: activeTreatments.total,
          href: ROUTES.PROFESSIONAL_TREATMENTS,
          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        }),
        StatCard({
          label: 'Notificaciones sin leer',
          value: unreadNotifications,
          href: ROUTES.PROFESSIONAL_NOTIFICATIONS,
          icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        }),
      ].join('');

      todayNode.innerHTML = todayItems.length
        ? Card({ content: `<ul class="flex flex-col divide-y divide-black/5">${todayItems.map(AgendaRow).join('')}</ul>` })
        : EmptyState({ title: 'Sin citas hoy', description: 'No tienes citas programadas para hoy.' });

      upcomingNode.innerHTML = upcoming.data.length
        ? Card({ content: `<ul class="flex flex-col divide-y divide-black/5">${upcoming.data.map(AgendaRow).join('')}</ul>` })
        : EmptyState({ title: 'Sin próximas citas', description: 'Agenda una cita desde las acciones rápidas.' });

      weeklyNode.innerHTML = Card({ content: WeeklyOverview(weekly.data) });

      notificationsNode.innerHTML = notifications.data.length
        ? Card({
            content: `<ul class="flex flex-col divide-y divide-black/5">${notifications.data
              .map(
                (item) => `
              <li class="flex items-start gap-3 py-3">
                <span class="mt-1 inline-flex shrink-0 items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-dark">
                  ${escapeHtml(NOTIFICATION_TYPE_LABELS[item.type] || item.type)}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-foreground">${escapeHtml(item.title)}</p>
                  <p class="text-xs text-muted">${formatRelative(item.created_at)}</p>
                </div>
              </li>`
              )
              .join('')}</ul>`,
          })
        : EmptyState({ title: 'Sin notificaciones', description: 'Aquí verás la actividad de tus pacientes.' });
    })
    .catch((error) => {
      statsNode.innerHTML = ErrorState({ message: error.message, retryId: 'dash-retry' });
      todayNode.innerHTML = '';
      upcomingNode.innerHTML = '';
      weeklyNode.innerHTML = '';
      notificationsNode.innerHTML = '';
      document.getElementById('dash-retry')?.addEventListener('click', mount);
    });
};
