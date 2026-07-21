/**
 * Appointment management — /professional/appointments (Part 5).
 *
 * Full lifecycle: create (for an assigned patient), reschedule/edit,
 * complete and cancel with a reason. Filters: status, patient and
 * date range; list is paginated. Every mutation notifies the patient
 * server-side.
 */

import { ROUTES, APPOINTMENT_STATUS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, StatusBadge } from '../../utils/format.util.js';
import { Button, Input, Select, Textarea } from '../../components/ui.components.js';
import {
  showToast,
  openModal,
  confirmDialog,
} from '../../components/feedback.components.js';
import {
  readForm,
  clearFieldErrors,
  applyFieldErrors,
  applyApiErrors,
  setSubmitting,
} from '../../utils/form.util.js';
import { createListController, FilterSelect } from '../../utils/list-view.util.js';
import {
  ProfessionalLayout,
  mountProfessionalLayout,
} from '../../layouts/professional.layout.js';
import {
  listAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  listPatients,
} from '../../services/professional.service.js';

/** Converts an ISO string to a datetime-local input value. */
const toLocalInput = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** One appointment row with contextual actions per status. */
const AppointmentItem = (appointment) => `
  <li class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-foreground">
          ${escapeHtml(`${appointment.patient_first_name} ${appointment.patient_last_name}`)}
        </p>
        <p class="text-sm text-foreground">${escapeHtml(appointment.reason || '')}</p>
        <p class="text-xs text-muted">
          ${formatDateTime(appointment.scheduled_at)}
          ${appointment.duration_minutes ? ` · ${appointment.duration_minutes} min` : ''}
          ${appointment.location ? ` · ${escapeHtml(appointment.location)}` : ''}
        </p>
        ${appointment.notes ? `<p class="mt-1 text-xs leading-relaxed text-muted">${escapeHtml(appointment.notes)}</p>` : ''}
        ${appointment.cancellation_reason ? `<p class="mt-1 text-xs text-error">Motivo de cancelación: ${escapeHtml(appointment.cancellation_reason)}</p>` : ''}
      </div>
      ${StatusBadge(appointment.status)}
    </div>
    ${appointment.status === APPOINTMENT_STATUS.SCHEDULED ? `
      <div class="flex flex-wrap gap-2">
        <button type="button" data-edit="${appointment.id}"
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/10">Editar</button>
        <button type="button" data-complete="${appointment.id}"
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/10">Marcar completada</button>
        <button type="button" data-cancel="${appointment.id}"
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10">Cancelar</button>
      </div>` : ''}
  </li>
`;

export const render = () =>
  ProfessionalLayout({
    active: 'appointments',
    breadcrumbs: [{ label: 'Inicio', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Citas' }],
    content: `
      <div class="flex flex-col gap-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-balance text-foreground">Citas</h1>
            <p class="mt-1 text-sm text-muted">Agenda y gestiona las citas de tus pacientes.</p>
          </div>
          ${Button({ id: 'new-appointment-button', label: 'Nueva cita', size: 'sm' })}
        </header>

        <form id="appointment-filters" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filtros de citas">
          ${FilterSelect({
            id: 'filter-status',
            label: 'Estado',
            options: [
              { value: APPOINTMENT_STATUS.SCHEDULED, label: 'Programada' },
              { value: APPOINTMENT_STATUS.COMPLETED, label: 'Completada' },
              { value: APPOINTMENT_STATUS.CANCELLED, label: 'Cancelada' },
            ],
          })}
          <div class="flex flex-col gap-1.5">
            <label for="filter-patient" class="text-sm font-medium text-foreground">Paciente</label>
            <select id="filter-patient"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todos</option>
            </select>
          </div>
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
        </form>

        <div id="appointment-list" aria-live="polite"></div>
        <div id="appointment-pagination"></div>
      </div>
    `,
  });

export const mount = ({ query }) => {
  mountProfessionalLayout();

  /** Assigned patients for the selects (loaded once). */
  let patients = [];

  const controller = createListController({
    listNode: document.getElementById('appointment-list'),
    paginationNode: document.getElementById('appointment-pagination'),
    fetcher: (params) => listAppointments(params),
    renderItem: AppointmentItem,
    empty: { title: 'Sin citas', description: 'Agenda tu primera cita con el botón "Nueva cita".' },
    onRendered: (rows) => wireActions(rows),
  });

  /* ------------------------------ Modal --------------------------- */

  const AppointmentForm = (appointment = null) => `
    <form id="appointment-form" novalidate class="flex flex-col gap-4">
      ${appointment
        ? `<p class="text-sm text-muted">Paciente: <span class="font-semibold text-foreground">${escapeHtml(`${appointment.patient_first_name} ${appointment.patient_last_name}`)}</span></p>`
        : Select({
            name: 'patientId',
            label: 'Paciente',
            required: true,
            options: patients.map((p) => ({ value: String(p.id), label: `${p.first_name} ${p.last_name}` })),
          })}
      ${Input({ name: 'scheduledAt', label: 'Fecha y hora', type: 'datetime-local', required: true, value: appointment ? toLocalInput(appointment.scheduled_at) : '' })}
      ${Input({ name: 'reason', label: 'Motivo', required: true, placeholder: 'Ej. Valoración inicial', value: appointment ? appointment.reason || '' : '' })}
      ${Input({ name: 'durationMinutes', label: 'Duración (minutos, opcional)', type: 'number', value: appointment?.duration_minutes ? String(appointment.duration_minutes) : '' })}
      ${Input({ name: 'location', label: 'Ubicación (opcional)', placeholder: 'Consultorio, clínica…', value: appointment ? appointment.location || '' : '' })}
      ${Textarea({ name: 'notes', label: 'Notas (opcional)', rows: 2 })}
      ${Button({ label: appointment ? 'Guardar cambios' : 'Agendar cita', type: 'submit', extra: 'w-full', id: 'appointment-submit' })}
    </form>
  `;

  const openAppointmentModal = (appointment = null, presetPatientId = '') => {
    const close = openModal({
      title: appointment ? 'Editar cita' : 'Nueva cita',
      content: AppointmentForm(appointment),
    });

    const form = document.getElementById('appointment-form');
    if (appointment?.notes) form.querySelector('#notes').value = appointment.notes;
    if (!appointment && presetPatientId) {
      const select = form.querySelector('#patientId');
      if (select) select.value = presetPatientId;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      const values = readForm(form);

      const errors = {};
      if (!appointment && !values.patientId) errors.patientId = 'Selecciona un paciente.';
      if (!values.scheduledAt) errors.scheduledAt = 'Indica la fecha y hora.';
      else if (new Date(values.scheduledAt) <= new Date()) errors.scheduledAt = 'La fecha debe ser futura.';
      if (!values.reason || values.reason.length < 3) errors.reason = 'Indica el motivo (mínimo 3 caracteres).';
      if (Object.keys(errors).length) {
        applyFieldErrors(errors);
        return;
      }

      const payload = {
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        reason: values.reason,
        durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
        location: values.location || undefined,
        notes: values.notes || undefined,
      };

      const submitButton = document.getElementById('appointment-submit');
      setSubmitting(submitButton, true);
      try {
        if (appointment) {
          await updateAppointment(appointment.id, payload);
          showToast('Cita actualizada. El paciente fue notificado.', 'success');
        } else {
          await createAppointment({ ...payload, patientId: Number(values.patientId) });
          showToast('Cita agendada. El paciente fue notificado.', 'success');
        }
        close();
        controller.load();
      } catch (error) {
        applyApiErrors(error.errors);
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });
  };

  /* --------------------------- Row actions ------------------------ */

  const wireActions = (rows) => {
    const listNode = document.getElementById('appointment-list');
    const findRow = (id) => rows.find((row) => String(row.id) === id);

    listNode.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const appointment = findRow(button.dataset.edit);
        if (appointment) openAppointmentModal(appointment);
      });
    });

    listNode.querySelectorAll('[data-complete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: 'Completar cita',
          message: '¿Marcar esta cita como completada?',
          confirmLabel: 'Completar',
        });
        if (!confirmed) return;
        try {
          await updateAppointment(button.dataset.complete, { status: APPOINTMENT_STATUS.COMPLETED });
          showToast('Cita marcada como completada.', 'success');
          controller.load();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });

    listNode.querySelectorAll('[data-cancel]').forEach((button) => {
      button.addEventListener('click', () => {
        const close = openModal({
          title: 'Cancelar cita',
          content: `
            <form id="cancel-form" class="flex flex-col gap-4" novalidate>
              <p class="text-sm leading-relaxed text-muted">El paciente será notificado de la cancelación.</p>
              ${Textarea({ name: 'cancelReason', label: 'Motivo (opcional)', rows: 2 })}
              ${Button({ label: 'Cancelar cita', type: 'submit', variant: 'danger', extra: 'w-full', id: 'cancel-submit' })}
            </form>
          `,
        });
        document.getElementById('cancel-form').addEventListener('submit', async (event) => {
          event.preventDefault();
          const reason = document.getElementById('cancelReason').value.trim();
          const submitButton = document.getElementById('cancel-submit');
          setSubmitting(submitButton, true);
          try {
            await cancelAppointment(button.dataset.cancel, reason || undefined);
            showToast('Cita cancelada. El paciente fue notificado.', 'success');
            close();
            controller.load();
          } catch (error) {
            showToast(error.message, 'error');
          } finally {
            setSubmitting(submitButton, false);
          }
        });
      });
    });
  };

  /* ------------------------------ Filters ------------------------- */

  const statusSelect = document.getElementById('filter-status');
  const patientSelect = document.getElementById('filter-patient');
  const fromInput = document.getElementById('filter-from');
  const toInput = document.getElementById('filter-to');

  const applyFilters = () => {
    controller.state.filters = {
      status: statusSelect.value,
      patientId: patientSelect.value,
      from: fromInput.value ? new Date(fromInput.value).toISOString() : '',
      to: toInput.value ? new Date(`${toInput.value}T23:59:59`).toISOString() : '',
    };
    controller.state.page = 1;
    controller.load();
  };
  document.getElementById('appointment-filters').addEventListener('change', applyFilters);
  document.getElementById('appointment-filters').addEventListener('submit', (event) => event.preventDefault());

  /* ------------------------------ Wiring -------------------------- */

  document
    .getElementById('new-appointment-button')
    .addEventListener('click', () => openAppointmentModal(null, query?.patientId || ''));

  /* Assigned patients for the form + filter selects. */
  listPatients({ limit: 100 })
    .then(({ data }) => {
      patients = data;
      data.forEach((patient) => {
        const option = document.createElement('option');
        option.value = String(patient.id);
        option.textContent = `${patient.first_name} ${patient.last_name}`;
        patientSelect.appendChild(option);
      });
      /* Quick action deep-link (?new=1&patientId=N). */
      if (query?.new) openAppointmentModal(null, query?.patientId || '');
    })
    .catch(() => showToast('No se pudieron cargar tus pacientes.', 'error'));

  controller.load();
};
