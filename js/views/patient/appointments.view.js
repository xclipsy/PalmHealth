/**
 * Patient appointments — view, filter, detail and cancel (Part 4).
 *
 * API:
 *   GET   /api/patient/appointments (status/date filters + pagination)
 *   PATCH /api/patient/appointments/:id/cancel
 *
 * Patients never create or edit appointments — only their assigned
 * professional schedules them. Cancelling is the single allowed write.
 */

import { ROUTES, APPOINTMENT_STATUS, STATUS_LABELS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, StatusBadge } from '../../utils/format.util.js';
import { Button } from '../../components/ui.components.js';
import { showToast, openModal, confirmDialog } from '../../components/feedback.components.js';
import { PatientLayout, mountPatientLayout } from '../../layouts/patient.layout.js';
import { createListController, FilterSelect } from '../../utils/list-view.util.js';
import { listAppointments, cancelAppointment } from '../../services/patient.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PATIENT_DASHBOARD }, { label: 'Citas' }];

/** One appointment row. */
const AppointmentItem = (appointment) => {
  const professional = `${appointment.professional_first_name || ''} ${appointment.professional_last_name || ''}`.trim();
  return `
    <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm font-semibold text-foreground">${formatDateTime(appointment.scheduled_at)}</p>
        ${StatusBadge(appointment.status)}
      </div>
      <p class="text-sm text-foreground">${escapeHtml(appointment.reason || 'Consulta')}</p>
      <p class="text-sm text-muted">${escapeHtml(professional)}${appointment.professional_specialty ? ` · ${escapeHtml(appointment.professional_specialty)}` : ''}</p>
      <div class="flex gap-2">
        <button type="button" data-detail="${appointment.id}"
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/10">Ver detalle</button>
        ${
          appointment.status === APPOINTMENT_STATUS.SCHEDULED
            ? `<button type="button" data-cancel="${appointment.id}"
                class="rounded-full px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10">Cancelar cita</button>`
            : ''
        }
      </div>
    </li>
  `;
};

/** Detail modal content. */
const AppointmentDetail = (appointment) => {
  const professional = `${appointment.professional_first_name || ''} ${appointment.professional_last_name || ''}`.trim();
  const rows = [
    ['Fecha y hora', formatDateTime(appointment.scheduled_at)],
    ['Estado', STATUS_LABELS[appointment.status] || appointment.status],
    ['Motivo', appointment.reason || '—'],
    ['Profesional', professional || '—'],
    ['Especialidad', appointment.professional_specialty || '—'],
    ['Ubicación', appointment.location || '—'],
    ['Duración', appointment.duration_minutes ? `${appointment.duration_minutes} minutos` : '—'],
    ['Notas', appointment.notes || '—'],
  ];
  if (appointment.cancellation_reason) rows.push(['Motivo de cancelación', appointment.cancellation_reason]);
  return `
    <dl class="flex flex-col gap-3">
      ${rows
        .map(
          ([label, value]) => `
        <div class="flex flex-col gap-0.5">
          <dt class="text-xs font-medium uppercase tracking-wide text-muted">${escapeHtml(label)}</dt>
          <dd class="text-sm text-foreground">${escapeHtml(String(value))}</dd>
        </div>`
        )
        .join('')}
    </dl>
  `;
};

export const render = () =>
  PatientLayout({
    active: 'appointments',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Mis citas</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Consulta tus próximas citas y tu historial. Solo tu profesional puede programarlas.</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3" role="group" aria-label="Filtros de citas">
          ${FilterSelect({
            id: 'filter-status',
            label: 'Estado',
            options: Object.values(APPOINTMENT_STATUS).map((status) => ({
              value: status,
              label: STATUS_LABELS[status] || status,
            })),
          })}
          <div class="flex flex-col gap-1.5">
            <label for="filter-from" class="text-sm font-medium text-foreground">Desde</label>
            <input id="filter-from" type="date"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="filter-to" class="text-sm font-medium text-foreground">Hasta</label>
            <input id="filter-to" type="date"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>

        <div id="appointments-list" aria-live="polite"></div>
        <div id="appointments-pagination"></div>
      </div>
    `,
  });

export const mount = () => {
  mountPatientLayout();

  const controller = createListController({
    listNode: document.getElementById('appointments-list'),
    paginationNode: document.getElementById('appointments-pagination'),
    fetcher: listAppointments,
    renderItem: AppointmentItem,
    empty: {
      title: 'Sin citas',
      description: 'Cuando tu profesional programe una cita, la verás aquí.',
    },
    onRendered: (rows) => {
      document.querySelectorAll('[data-detail]').forEach((button) => {
        button.addEventListener('click', () => {
          /* API ids are BIGSERIAL strings — compare as strings. */
          const appointment = rows.find((row) => String(row.id) === button.dataset.detail);
          if (appointment) {
            openModal({ title: 'Detalle de la cita', content: AppointmentDetail(appointment) });
          }
        });
      });
      document.querySelectorAll('[data-cancel]').forEach((button) => {
        button.addEventListener('click', async () => {
          const confirmed = await confirmDialog({
            title: 'Cancelar cita',
            message: '¿Seguro que deseas cancelar esta cita? Tu profesional será notificado.',
            confirmLabel: 'Cancelar cita',
            cancelLabel: 'Volver',
            danger: true,
          });
          if (!confirmed) return;
          try {
            await cancelAppointment(Number(button.dataset.cancel));
            showToast('Cita cancelada. Tu profesional fue notificado.', 'success');
            controller.load();
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      });
    },
  });

  const applyFilters = () => {
    controller.state.filters = {
      status: document.getElementById('filter-status').value,
      from: document.getElementById('filter-from').value,
      to: document.getElementById('filter-to').value,
    };
    controller.state.page = 1;
    controller.load();
  };
  ['filter-status', 'filter-from', 'filter-to'].forEach((id) => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  controller.load();
};
