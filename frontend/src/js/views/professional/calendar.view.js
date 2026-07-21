/**
 * Appointment calendar — /professional/calendar (Part 5).
 *
 * Month grid built from GET /professional/calendar?year=&month=.
 * Days with appointments show compact chips; clicking a day opens a
 * modal with that day's full agenda. Month navigation re-fetches.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, StatusBadge } from '../../utils/format.util.js';
import { Card } from '../../components/ui.components.js';
import { Skeleton, ErrorState, openModal } from '../../components/feedback.components.js';
import {
  ProfessionalLayout,
  mountProfessionalLayout,
} from '../../layouts/professional.layout.js';
import { getCalendar } from '../../services/professional.service.js';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Status → chip color for the day cells. */
const chipColor = (status) =>
  status === 'CANCELLED'
    ? 'bg-error/10 text-error'
    : status === 'COMPLETED'
      ? 'bg-primary/15 text-primary-dark'
      : 'bg-accent/15 text-accent-dark';

export const render = () =>
  ProfessionalLayout({
    active: 'calendar',
    breadcrumbs: [{ label: 'Inicio', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Calendario' }],
    content: `
      <div class="flex flex-col gap-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-balance text-foreground">Calendario</h1>
            <p class="mt-1 text-sm text-muted">Tu agenda mensual de citas.</p>
          </div>
          <div class="flex items-center gap-2" role="group" aria-label="Navegación de mes">
            <button type="button" id="prev-month" aria-label="Mes anterior"
              class="flex h-10 w-10 items-center justify-center rounded-full text-foreground ring-1 ring-black/10 hover:bg-black/5">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span id="month-label" class="min-w-40 text-center text-sm font-semibold text-foreground" aria-live="polite"></span>
            <button type="button" id="next-month" aria-label="Mes siguiente"
              class="flex h-10 w-10 items-center justify-center rounded-full text-foreground ring-1 ring-black/10 hover:bg-black/5">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </header>
        <div id="calendar-grid">${Card({ content: Skeleton({ lines: 8 }) })}</div>
      </div>
    `,
  });

export const mount = () => {
  mountProfessionalLayout();

  const gridNode = document.getElementById('calendar-grid');
  const labelNode = document.getElementById('month-label');
  const today = new Date();
  const state = { year: today.getFullYear(), month: today.getMonth() + 1 };

  const load = async () => {
    labelNode.textContent = `${MONTH_NAMES[state.month - 1]} ${state.year}`;
    gridNode.innerHTML = Card({ content: Skeleton({ lines: 8 }) });
    try {
      const { data: appointments } = await getCalendar(state.year, state.month);

      /* Group appointments by day of month. */
      const byDay = new Map();
      appointments.forEach((appointment) => {
        const day = new Date(appointment.scheduled_at).getDate();
        if (!byDay.has(day)) byDay.set(day, []);
        byDay.get(day).push(appointment);
      });

      const daysInMonth = new Date(state.year, state.month, 0).getDate();
      const firstWeekday = (new Date(state.year, state.month - 1, 1).getDay() + 6) % 7; // Monday=0
      const isCurrentMonth =
        today.getFullYear() === state.year && today.getMonth() + 1 === state.month;

      const cells = [];
      for (let i = 0; i < firstWeekday; i += 1) cells.push('<div aria-hidden="true"></div>');
      for (let day = 1; day <= daysInMonth; day += 1) {
        const items = byDay.get(day) || [];
        const isToday = isCurrentMonth && day === today.getDate();
        cells.push(`
          <div class="flex min-h-20 flex-col gap-1 rounded-2xl p-2 ${isToday ? 'bg-primary/10 ring-1 ring-primary/40' : 'ring-1 ring-black/5'}">
            <span class="text-xs font-semibold ${isToday ? 'text-primary-dark' : 'text-muted'}">${day}</span>
            ${items.length
              ? `<button type="button" data-day="${day}"
                  class="flex flex-col gap-1 text-left"
                  aria-label="${items.length} citas el día ${day}">
                  ${items.slice(0, 2).map((appointment) => `
                    <span class="block truncate rounded-lg px-1.5 py-0.5 text-xs font-medium ${chipColor(appointment.status)}">
                      ${new Date(appointment.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      ${escapeHtml(appointment.patient_first_name)}
                    </span>`).join('')}
                  ${items.length > 2 ? `<span class="text-xs text-muted">+${items.length - 2} más</span>` : ''}
                </button>`
              : ''}
          </div>
        `);
      }

      gridNode.innerHTML = Card({
        content: `
          <div class="grid grid-cols-7 gap-2">
            ${WEEKDAYS.map((weekday) => `<div class="text-center text-xs font-bold uppercase tracking-wide text-muted">${weekday}</div>`).join('')}
            ${cells.join('')}
          </div>
        `,
      });

      /* Day detail modal. */
      gridNode.querySelectorAll('[data-day]').forEach((button) => {
        button.addEventListener('click', () => {
          const items = byDay.get(Number(button.dataset.day)) || [];
          openModal({
            title: `Citas del ${button.dataset.day} de ${MONTH_NAMES[state.month - 1].toLowerCase()}`,
            content: `
              <ul class="flex flex-col divide-y divide-black/5">
                ${items.map((appointment) => `
                  <li class="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-foreground">
                        ${escapeHtml(`${appointment.patient_first_name} ${appointment.patient_last_name}`)}
                      </p>
                      <p class="text-sm text-foreground">${escapeHtml(appointment.reason || '')}</p>
                      <p class="text-xs text-muted">${formatDateTime(appointment.scheduled_at)}${appointment.location ? ` · ${escapeHtml(appointment.location)}` : ''}</p>
                    </div>
                    ${StatusBadge(appointment.status)}
                  </li>`).join('')}
              </ul>
            `,
          });
        });
      });
    } catch (error) {
      gridNode.innerHTML = ErrorState({ message: error.message, retryId: 'calendar-retry' });
      document.getElementById('calendar-retry')?.addEventListener('click', load);
    }
  };

  document.getElementById('prev-month').addEventListener('click', () => {
    state.month -= 1;
    if (state.month === 0) {
      state.month = 12;
      state.year -= 1;
    }
    load();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    state.month += 1;
    if (state.month === 13) {
      state.month = 1;
      state.year += 1;
    }
    load();
  });

  load();
};
