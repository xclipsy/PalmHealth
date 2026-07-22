/**
 * Read-only clinical views: treatments, medications, routines and
 * professional observations (Part 4 — patients can only read these).
 *
 * API:
 *   GET /api/patient/treatments    (status filter + pagination)
 *   GET /api/patient/medications   (status filter + pagination)
 *   GET /api/patient/routines      (status filter + pagination)
 *   GET /api/patient/observations  (pagination — API already excludes
 *                                   entries with visible_to_patient = false)
 *
 * All four share the same page skeleton via buildReadOnlyView.
 */

import { ROUTES, TREATMENT_STATUS, STATUS_LABELS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDate, formatDateTime, StatusBadge } from '../../utils/format.util.js';
import { PatientLayout, mountPatientLayout } from '../../layouts/patient.layout.js';
import { createListController, FilterSelect } from '../../utils/list-view.util.js';
import {
  listTreatments,
  listMedications,
  listRoutines,
  listObservations,
} from '../../services/patient.service.js';

/** Status filter options shared by treatments/medications/routines. */
const STATUS_OPTIONS = Object.values(TREATMENT_STATUS).map((status) => ({
  value: status,
  label: STATUS_LABELS[status] || status,
}));

/**
 * Factory for a read-only paginated page.
 * @param {{
 *   active: string, title: string, subtitle: string, crumb: string,
 *   fetcher: Function, renderItem: Function,
 *   empty: { title: string, description: string },
 *   withStatusFilter?: boolean,
 * }} config
 * @returns {{ render: Function, mount: Function }}
 */
const buildReadOnlyView = ({ active, title, subtitle, crumb, fetcher, renderItem, empty, withStatusFilter = true }) => ({
  render: () =>
    PatientLayout({
      active,
      breadcrumbs: [{ label: 'Panel', href: ROUTES.PATIENT_DASHBOARD }, { label: crumb }],
      content: `
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground text-balance">${escapeHtml(title)}</h1>
            <p class="mt-1 text-sm leading-relaxed text-muted">${escapeHtml(subtitle)}</p>
          </div>
          ${
            withStatusFilter
              ? `<div class="max-w-xs" role="group" aria-label="Filtro por estado">
                  ${FilterSelect({ id: 'filter-status', label: 'Estado', options: STATUS_OPTIONS })}
                </div>`
              : ''
          }
          <div id="clinical-list" aria-live="polite"></div>
          <div id="clinical-pagination"></div>
        </div>
      `,
    }),
  mount: () => {
    mountPatientLayout();
    const controller = createListController({
      listNode: document.getElementById('clinical-list'),
      paginationNode: document.getElementById('clinical-pagination'),
      fetcher,
      renderItem,
      empty,
    });
    if (withStatusFilter) {
      document.getElementById('filter-status').addEventListener('change', (event) => {
        controller.state.filters = { status: event.target.value };
        controller.state.page = 1;
        controller.load();
      });
    }
    controller.load();
  },
});

/** Professional name helper. */
const proName = (row) => `${row.professional_first_name || ''} ${row.professional_last_name || ''}`.trim();

/* ------------------------------ Treatments ------------------------ */

const treatments = buildReadOnlyView({
  active: 'treatments',
  title: 'Mis tratamientos',
  subtitle: 'Planes indicados por tu profesional. Esta información es de solo lectura.',
  crumb: 'Tratamientos',
  fetcher: listTreatments,
  empty: { title: 'Sin tratamientos', description: 'Cuando tu profesional cree un plan de tratamiento, lo verás aquí.' },
  renderItem: (t) => `
    <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-semibold text-foreground">${escapeHtml(t.title)}</span>
        ${StatusBadge(t.status)}
      </div>
      ${t.description ? `<p class="text-sm leading-relaxed text-foreground">${escapeHtml(t.description)}</p>` : ''}
      ${t.instructions ? `<p class="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground"><span class="font-medium">Indicaciones:</span> ${escapeHtml(t.instructions)}</p>` : ''}
      <p class="text-xs text-muted">
        ${escapeHtml(proName(t))} · Del ${formatDate(t.start_date)} ${t.end_date ? `al ${formatDate(t.end_date)}` : '(en curso)'}
      </p>
    </li>
  `,
});

export const renderTreatments = treatments.render;
export const mountTreatments = treatments.mount;

/* ------------------------------ Medications ----------------------- */

const medications = buildReadOnlyView({
  active: 'medications',
  title: 'Mi medicación',
  subtitle: 'Prescripciones activas e históricas. Solo tu profesional puede modificarlas.',
  crumb: 'Medicación',
  fetcher: listMedications,
  empty: { title: 'Sin medicación', description: 'Las prescripciones de tu profesional aparecerán aquí.' },
  renderItem: (m) => `
    <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-semibold text-foreground">${escapeHtml(m.medication_name)}</span>
        ${StatusBadge(m.status)}
      </div>
      <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground">
        <span><span class="font-medium">Dosis:</span> ${escapeHtml(m.dosage || '—')}</span>
        <span><span class="font-medium">Frecuencia:</span> ${escapeHtml(m.frequency || '—')}</span>
      </div>
      ${m.instructions ? `<p class="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground"><span class="font-medium">Instrucciones:</span> ${escapeHtml(m.instructions)}</p>` : ''}
      <p class="text-xs text-muted">
        ${escapeHtml(proName(m))} · Del ${formatDate(m.start_date)} ${m.end_date ? `al ${formatDate(m.end_date)}` : '(sin fecha de término)'}
      </p>
    </li>
  `,
});

export const renderMedications = medications.render;
export const mountMedications = medications.mount;

/* -------------------------------- Routines ------------------------ */

const ROUTINE_TYPE_LABELS = { EXERCISE: 'Ejercicio', NUTRITION: 'Nutrición', LIFESTYLE: 'Estilo de vida' };

const routines = buildReadOnlyView({
  active: 'routines',
  title: 'Mis rutinas',
  subtitle: 'Rutinas de ejercicio, nutrición y estilo de vida asignadas por tu profesional.',
  crumb: 'Rutinas',
  fetcher: listRoutines,
  empty: { title: 'Sin rutinas asignadas', description: 'Cuando tu profesional te asigne una rutina, la verás aquí.' },
  renderItem: (r) => `
    <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-foreground">${escapeHtml(r.routine_name)}</span>
          <span class="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-foreground">${escapeHtml(ROUTINE_TYPE_LABELS[r.routine_type] || r.routine_type || '')}</span>
        </div>
        ${StatusBadge(r.status)}
      </div>
      ${r.routine_description ? `<p class="text-sm leading-relaxed text-foreground">${escapeHtml(r.routine_description)}</p>` : ''}
      ${r.notes ? `<p class="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground"><span class="font-medium">Indicaciones:</span> ${escapeHtml(r.notes)}</p>` : ''}
      <p class="text-xs text-muted">
        ${escapeHtml(proName(r))} · Desde ${formatDate(r.start_date)} ${r.end_date ? `hasta ${formatDate(r.end_date)}` : ''}
      </p>
    </li>
  `,
});

export const renderRoutines = routines.render;
export const mountRoutines = routines.mount;

/* ------------------------------ Observations ---------------------- */

const observations = buildReadOnlyView({
  active: 'observations',
  title: 'Observaciones de tu profesional',
  subtitle: 'Notas que tu profesional decidió compartir contigo.',
  crumb: 'Observaciones',
  fetcher: listObservations,
  withStatusFilter: false,
  empty: { title: 'Sin observaciones', description: 'Aquí verás las notas que tu profesional comparta contigo.' },
  renderItem: (o) => `
    <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-semibold text-foreground">${escapeHtml(proName(o))}</span>
        <span class="text-xs text-muted">${formatDateTime(o.created_at)}</span>
      </div>
      <p class="text-sm leading-relaxed text-foreground">${escapeHtml(o.content || '')}</p>
    </li>
  `,
});

export const renderObservations = observations.render;
export const mountObservations = observations.mount;
