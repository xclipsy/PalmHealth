/**
 * Patient clinical detail — /professional/patients/:id (Part 5).
 *
 * Header with personal/contact data + assignment control, then a
 * tabbed clinical record: summary, symptoms (with intensity trend),
 * appointments, treatments, medications, routines and observations.
 * The API enforces the assignment guard on every request; a 403/404
 * here renders the friendly error state.
 */

import { ROUTES, TREATMENT_STATUS, ASSIGNMENT_STATUS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import {
  formatDate,
  formatDateTime,
  StatusBadge,
  IntensityMeter,
} from '../../utils/format.util.js';
import { Avatar, Button, Card } from '../../components/ui.components.js';
import {
  Skeleton,
  EmptyState,
  ErrorState,
  showToast,
  confirmDialog,
} from '../../components/feedback.components.js';
import { createListController } from '../../utils/list-view.util.js';
import { router } from '../../router/router.js';
import {
  ProfessionalLayout,
  mountProfessionalLayout,
} from '../../layouts/professional.layout.js';
import {
  getPatientDetail,
  updateAssignment,
  listPatientSymptoms,
  listAppointments,
  listTreatments,
  listPrescriptions,
  listRoutineAssignments,
  listObservations,
} from '../../services/professional.service.js';

/** Tab model: id, label. Content nodes share the ids below. */
const TABS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'symptoms', label: 'Síntomas' },
  { id: 'appointments', label: 'Citas' },
  { id: 'treatments', label: 'Tratamientos' },
  { id: 'medications', label: 'Medicación' },
  { id: 'routines', label: 'Rutinas' },
  { id: 'observations', label: 'Observaciones' },
];

/** Small labeled value used in the header grid. */
const InfoItem = (label, value) => `
  <div class="flex flex-col">
    <dt class="text-xs font-medium uppercase tracking-wide text-muted">${escapeHtml(label)}</dt>
    <dd class="text-sm font-medium text-foreground">${escapeHtml(value || '—')}</dd>
  </div>
`;

/** Age in years from a birth date. */
const ageFrom = (birthDate) => {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

/* ------------------------- Item renderers ------------------------- */

const SymptomItem = (symptom) => `
  <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-foreground">${escapeHtml(symptom.category_name || 'Síntoma')}</p>
        <p class="text-xs text-muted">${formatDateTime(symptom.created_at)}${symptom.body_zone ? ` · ${escapeHtml(symptom.body_zone)}` : ''}</p>
      </div>
      ${IntensityMeter(symptom.intensity)}
    </div>
    <p class="text-sm leading-relaxed text-foreground">${escapeHtml(symptom.description || '')}</p>
  </li>
`;

const AppointmentItem = (appointment) => `
  <li class="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
    <div class="min-w-0">
      <p class="truncate text-sm font-semibold text-foreground">${escapeHtml(appointment.reason || 'Cita')}</p>
      <p class="text-xs text-muted">${formatDateTime(appointment.scheduled_at)}${appointment.location ? ` · ${escapeHtml(appointment.location)}` : ''}</p>
    </div>
    ${StatusBadge(appointment.status)}
  </li>
`;

const TreatmentItem = (treatment) => `
  <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold text-foreground">${escapeHtml(treatment.title)}</p>
      ${StatusBadge(treatment.status)}
    </div>
    <p class="text-sm leading-relaxed text-muted">${escapeHtml(treatment.description || '')}</p>
    <p class="text-xs text-muted">Inicio: ${formatDate(treatment.start_date || treatment.created_at)}</p>
  </li>
`;

const PrescriptionItem = (prescription) => `
  <li class="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold text-foreground">${escapeHtml(prescription.medication_name)}</p>
      ${StatusBadge(prescription.status)}
    </div>
    <p class="text-sm text-muted">${escapeHtml(prescription.dosage || '')}${prescription.frequency ? ` · ${escapeHtml(prescription.frequency)}` : ''}</p>
    ${prescription.instructions ? `<p class="text-xs leading-relaxed text-muted">${escapeHtml(prescription.instructions)}</p>` : ''}
  </li>
`;

const RoutineItem = (routine) => `
  <li class="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold text-foreground">${escapeHtml(routine.routine_name)}</p>
      ${StatusBadge(routine.status)}
    </div>
    <p class="text-sm text-muted">${escapeHtml(routine.routine_type || '')}${routine.schedule ? ` · ${escapeHtml(routine.schedule)}` : ''}</p>
  </li>
`;

const ObservationItem = (observation) => `
  <li class="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm font-semibold text-foreground">${escapeHtml(observation.title)}</p>
      <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        observation.visible_to_patient
          ? 'bg-success/15 text-foreground ring-success/40'
          : 'bg-black/5 text-muted ring-black/10'
      }">${observation.visible_to_patient ? 'Visible al paciente' : 'Privada'}</span>
    </div>
    <p class="text-sm leading-relaxed text-foreground">${escapeHtml(observation.content || '')}</p>
    <p class="text-xs text-muted">${formatDateTime(observation.created_at)}</p>
  </li>
`;

/**
 * Intensity trend chart from recent symptoms (chronological bars).
 * @param {Array} symptoms - Newest-first list from the API.
 * @returns {string}
 */
const IntensityTrend = (symptoms) => {
  if (!symptoms.length) return '';
  const points = [...symptoms].reverse().slice(-14);
  return `
    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-foreground">Tendencia de intensidad (últimos registros)</h3>
      <div class="flex items-end gap-1.5" role="img" aria-label="Tendencia de intensidad de los últimos ${points.length} registros">
        ${points
          .map((symptom) => {
            const value = Math.max(1, Math.min(10, Number(symptom.intensity) || 1));
            const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-warning' : 'bg-success';
            return `<div class="flex-1 rounded-t ${color}" style="height: ${value * 7}px" title="${value}/10 — ${formatDate(symptom.created_at)}"></div>`;
          })
          .join('')}
      </div>
      <p class="text-xs text-muted">Cada barra es un registro del paciente, del más antiguo al más reciente.</p>
    </div>
  `;
};

/* ------------------------------ Render ---------------------------- */

export const render = ({ params }) =>
  ProfessionalLayout({
    active: 'patients',
    breadcrumbs: [
      { label: 'Inicio', href: ROUTES.PROFESSIONAL_DASHBOARD },
      { label: 'Pacientes', href: ROUTES.PROFESSIONAL_PATIENTS },
      { label: 'Expediente' },
    ],
    content: `
      <div class="flex flex-col gap-6" data-patient-id="${escapeHtml(params.id)}">
        <div id="patient-header">${Card({ content: Skeleton({ lines: 4 }) })}</div>

        <div role="tablist" aria-label="Expediente clínico" class="flex flex-wrap gap-2">
          ${TABS.map(
            (tab, index) => `
            <button type="button" role="tab" id="tab-${tab.id}" data-tab="${tab.id}"
              aria-selected="${index === 0}" aria-controls="panel-${tab.id}" ${index === 0 ? '' : 'tabindex="-1"'}
              class="rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                index === 0 ? 'bg-primary text-white' : 'bg-surface text-muted ring-1 ring-black/10 hover:text-foreground'
              }">${escapeHtml(tab.label)}</button>`
          ).join('')}
        </div>

        ${TABS.map(
          (tab, index) => `
          <div role="tabpanel" id="panel-${tab.id}" aria-labelledby="tab-${tab.id}"
            class="${index === 0 ? '' : 'hidden'} flex flex-col gap-4">
            ${tab.id === 'symptoms' ? `
              <div id="symptom-trend"></div>
              <form id="symptom-filters" class="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Filtros de síntomas">
                <div class="flex flex-col gap-1.5">
                  <label for="symptom-from" class="text-sm font-medium text-foreground">Desde</label>
                  <input id="symptom-from" type="date"
                    class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="symptom-to" class="text-sm font-medium text-foreground">Hasta</label>
                  <input id="symptom-to" type="date"
                    class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </form>` : ''}
            <div id="list-${tab.id}" aria-live="polite"></div>
            <div id="pagination-${tab.id}"></div>
          </div>`
        ).join('')}
      </div>
    `,
  });

/* ------------------------------ Mount ----------------------------- */

export const mount = ({ params }) => {
  mountProfessionalLayout();
  const patientId = params.id;

  /* ------------------------- Header + summary --------------------- */

  const headerNode = document.getElementById('patient-header');

  const loadHeader = async () => {
    try {
      const { data: patient } = await getPatientDetail(patientId);
      const fullName = `${patient.first_name} ${patient.last_name}`;
      const age = ageFrom(patient.birth_date);

      headerNode.innerHTML = Card({
        content: `
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                ${Avatar({ name: fullName, size: 'lg' })}
                <div>
                  <h1 class="text-xl font-bold text-balance text-foreground">${escapeHtml(fullName)}</h1>
                  <p class="text-sm text-muted">${escapeHtml(patient.email || '')}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                ${Button({ label: 'Nueva cita', size: 'sm', href: `${ROUTES.PROFESSIONAL_APPOINTMENTS}?new=1&patientId=${patientId}` })}
                ${Button({ label: 'Nueva observación', size: 'sm', variant: 'outline', href: `${ROUTES.PROFESSIONAL_OBSERVATIONS}?new=1&patientId=${patientId}` })}
                ${Button({ label: 'Finalizar vinculación', size: 'sm', variant: 'ghost', id: 'end-assignment' })}
              </div>
            </div>
            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              ${InfoItem('Fecha de nacimiento', `${formatDate(patient.birth_date)}${age !== null ? ` (${age} años)` : ''}`)}
              ${InfoItem('Género', patient.gender)}
              ${InfoItem('Teléfono', patient.phone)}
              ${InfoItem('Contacto de emergencia', patient.emergency_contact_name)}
              ${InfoItem('Tel. de emergencia', patient.emergency_contact_phone)}
            </dl>
          </div>
        `,
      });

      document.getElementById('end-assignment')?.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: 'Finalizar vinculación',
          message: `¿Deseas finalizar la vinculación con ${fullName}? Dejarás de ver su expediente.`,
          confirmLabel: 'Finalizar',
          danger: true,
        });
        if (!confirmed) return;
        try {
          await updateAssignment(patientId, ASSIGNMENT_STATUS.COMPLETED);
          showToast('Vinculación finalizada.', 'success');
          router.navigate(ROUTES.PROFESSIONAL_PATIENTS);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    } catch (error) {
      headerNode.innerHTML = ErrorState({ message: error.message, retryId: 'header-retry' });
      document.getElementById('header-retry')?.addEventListener('click', loadHeader);
    }
  };

  /* --------------------------- Tab wiring ------------------------- */

  const controllers = {};
  const loaded = new Set();

  const makeController = (tabId, fetcher, renderItem, emptyTitle, onRendered) =>
    createListController({
      listNode: document.getElementById(`list-${tabId}`),
      paginationNode: document.getElementById(`pagination-${tabId}`),
      fetcher,
      renderItem,
      empty: { title: emptyTitle, description: 'Este paciente aún no tiene registros aquí.' },
      onRendered,
    });

  controllers.symptoms = makeController(
    'symptoms',
    (query) => listPatientSymptoms(patientId, query),
    SymptomItem,
    'Sin síntomas registrados',
    (rows) => {
      document.getElementById('symptom-trend').innerHTML = rows.length
        ? Card({ content: IntensityTrend(rows) })
        : '';
    }
  );
  controllers.appointments = makeController(
    'appointments',
    (query) => listAppointments({ ...query, patientId }),
    AppointmentItem,
    'Sin citas'
  );
  controllers.treatments = makeController(
    'treatments',
    (query) => listTreatments({ ...query, patientId }),
    TreatmentItem,
    'Sin tratamientos'
  );
  controllers.medications = makeController(
    'medications',
    (query) => listPrescriptions({ ...query, patientId }),
    PrescriptionItem,
    'Sin medicación asignada'
  );
  controllers.routines = makeController(
    'routines',
    (query) => listRoutineAssignments({ ...query, patientId }),
    RoutineItem,
    'Sin rutinas asignadas'
  );
  controllers.observations = makeController(
    'observations',
    (query) => listObservations({ ...query, patientId }),
    ObservationItem,
    'Sin observaciones'
  );

  /* Summary tab: compact clinical overview loaded in parallel. */
  const loadSummary = async () => {
    const node = document.getElementById('list-summary');
    node.innerHTML = Card({ content: Skeleton({ lines: 6 }) });
    try {
      const [symptoms, appointments, treatments, prescriptions] = await Promise.all([
        listPatientSymptoms(patientId, { limit: 3 }),
        listAppointments({ patientId, status: 'SCHEDULED', from: new Date().toISOString(), limit: 3, sort: 'scheduled_at', order: 'asc' }),
        listTreatments({ patientId, status: TREATMENT_STATUS.ACTIVE, limit: 3 }),
        listPrescriptions({ patientId, status: TREATMENT_STATUS.ACTIVE, limit: 3 }),
      ]);

      const block = (title, items, renderItem, emptyLabel) => `
        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-bold text-foreground">${title}</h3>
          ${items.length
            ? `<ul class="flex flex-col divide-y divide-black/5">${items.map(renderItem).join('')}</ul>`
            : `<p class="text-sm text-muted">${emptyLabel}</p>`}
        </section>
      `;

      node.innerHTML = Card({
        content: `
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            ${block('Últimos síntomas', symptoms.data, SymptomItem, 'Sin registros recientes.')}
            ${block('Próximas citas', appointments.data, AppointmentItem, 'Sin citas programadas.')}
            ${block('Tratamientos activos', treatments.data, TreatmentItem, 'Sin tratamientos activos.')}
            ${block('Medicación activa', prescriptions.data, PrescriptionItem, 'Sin medicación activa.')}
          </div>
        `,
      });
    } catch (error) {
      node.innerHTML = ErrorState({ message: error.message, retryId: 'summary-retry' });
      document.getElementById('summary-retry')?.addEventListener('click', loadSummary);
    }
  };

  const activateTab = (tabId) => {
    document.querySelectorAll('[role="tab"]').forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.setAttribute('aria-selected', String(isActive));
      tab.toggleAttribute('tabindex', !isActive);
      if (!isActive) tab.setAttribute('tabindex', '-1');
      tab.className = `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        isActive ? 'bg-primary text-white' : 'bg-surface text-muted ring-1 ring-black/10 hover:text-foreground'
      }`;
    });
    TABS.forEach((tab) => {
      document.getElementById(`panel-${tab.id}`).classList.toggle('hidden', tab.id !== tabId);
    });

    if (!loaded.has(tabId)) {
      loaded.add(tabId);
      if (tabId === 'summary') loadSummary();
      else controllers[tabId].load();
    }
  };

  const tablist = document.querySelector('[role="tablist"]');
  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activateTab(tab.dataset.tab);
  });
  /* Keyboard navigation between tabs (arrow keys). */
  tablist.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    const next = (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    activateTab(tabs[next].dataset.tab);
  });

  /* Symptom date filters. */
  document.getElementById('symptom-filters')?.addEventListener('change', () => {
    controllers.symptoms.state.filters.from = document.getElementById('symptom-from').value;
    controllers.symptoms.state.filters.to = document.getElementById('symptom-to').value;
    controllers.symptoms.state.page = 1;
    controllers.symptoms.load();
  });

  loadHeader();
  loaded.add('summary');
  loadSummary();
};
