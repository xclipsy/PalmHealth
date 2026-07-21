/**
 * Professional clinical management views — treatments, prescriptions,
 * routine assignments and observations.
 *
 * All four sections share the same architecture:
 *   list (paginated, filterable) → create modal → edit modal.
 * Ownership is enforced server-side; the UI only offers linked patients.
 */

import * as service from '../../services/professional.service.js';
import { ROUTES, TREATMENT_STATUS, STATUS_LABELS } from '../../constants/app.constants.js';
import { ProfessionalLayout, mountProfessionalLayout } from '../../layouts/professional.layout.js';
import { Button, Input, Textarea, Select, Card } from '../../components/ui.components.js';
import { EmptyState, showToast, openModal } from '../../components/feedback.components.js';
import { formatDate, StatusBadge } from '../../utils/format.util.js';
import { createListController, FilterSelect } from '../../utils/list-view.util.js';
import { readForm, applyApiErrors, clearFieldErrors, setSubmitting } from '../../utils/form.util.js';
import { escapeHtml } from '../../utils/dom.util.js';

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

/** Cached linked-patient options for the create modals. */
let patientOptionsCache = null;

/**
 * Loads ACTIVE linked patients as select options (cached per page view).
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
const loadPatientOptions = async () => {
  if (patientOptionsCache) return patientOptionsCache;
  const { data } = await service.listPatients({ status: 'ACTIVE', limit: 100 });
  patientOptionsCache = data.map((p) => ({
    value: String(p.id),
    label: `${p.first_name} ${p.last_name}`,
  }));
  return patientOptionsCache;
};

/** Status filter options shared by the four sections. */
const statusFilterOptions = [
  { value: '', label: 'Todos los estados' },
  { value: TREATMENT_STATUS.ACTIVE, label: STATUS_LABELS.ACTIVE },
  { value: TREATMENT_STATUS.COMPLETED, label: STATUS_LABELS.COMPLETED },
  { value: TREATMENT_STATUS.SUSPENDED, label: STATUS_LABELS.SUSPENDED },
];

/** Lifecycle select used inside edit modals. */
const statusEditSelect = (current) => Select({
  name: 'status',
  label: 'Estado',
  options: statusFilterOptions.slice(1).map((o) => ({
    ...o,
    selected: o.value === current,
  })),
  placeholder: 'Sin cambio',
});

/**
 * Generic page shell for a clinical section.
 * @param {Object} cfg — { title, description, createLabel }
 * @returns {string} HTML for the section body.
 */
const sectionShell = ({ title, description, createLabel, filtersHtml }) => `
  <section aria-labelledby="section-title">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 id="section-title" class="text-2xl font-semibold text-foreground text-balance">${title}</h1>
        <p class="mt-1 text-sm text-muted text-pretty">${description}</p>
      </div>
      ${Button({ label: createLabel, id: 'create-btn' })}
    </div>
    <div class="mb-4 flex flex-wrap items-end gap-3">${filtersHtml}</div>
    <div id="list-region" aria-live="polite"></div>
  </section>
`;

/**
 * Opens a modal with a form and wires validation + submit.
 * @param {Object} cfg — { title, formHtml, submitLabel, onSubmit }
 */
const openFormModal = ({ title, formHtml, submitLabel, onSubmit }) => {
  /* openModal returns the close function directly. */
  const closeModal = openModal({
    title,
    content: `
      <form id="clinical-form" novalidate>
        <div class="flex flex-col gap-4">${formHtml}</div>
        <div class="mt-6 flex justify-end gap-3">
          ${Button({ label: 'Cancelar', variant: 'ghost', id: 'modal-cancel' })}
          ${Button({ label: submitLabel, type: 'submit', id: 'modal-submit' })}
        </div>
      </form>
    `,
  });

  const form = document.getElementById('clinical-form');
  document.getElementById('modal-cancel').addEventListener('click', closeModal);

  const submitButton = document.getElementById('modal-submit');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);
    setSubmitting(submitButton, true);
    try {
      await onSubmit(readForm(form));
      closeModal();
    } catch (error) {
      applyApiErrors(error.errors);
      if (!error.errors?.length) showToast(error.message, 'error');
    } finally {
      setSubmitting(submitButton, false);
    }
  });
};

/**
 * Builds the standard mount for a clinical section.
 * @param {Object} cfg — section wiring config.
 */
const mountSection = ({ fetcher, renderRow, onCreate, onEdit, emptyTitle, emptyDescription }) => {
  patientOptionsCache = null;

  /* The shared controller expects separate list/pagination nodes. */
  const region = document.getElementById('list-region');
  region.innerHTML = '<div id="list-items"></div><div id="list-pagination" class="mt-4"></div>';

  const controller = createListController({
    listNode: document.getElementById('list-items'),
    paginationNode: document.getElementById('list-pagination'),
    fetcher,
    renderItem: renderRow,
    empty: { title: emptyTitle, description: emptyDescription },
  });

  document.getElementById('create-btn').addEventListener('click', () => onCreate(controller));

  region.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit]');
    if (button) onEdit(button.dataset.edit, controller);
  });

  const statusFilter = document.getElementById('filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      controller.state.filters.status = statusFilter.value;
      controller.state.page = 1;
      controller.load();
    });
  }

  controller.load();
  return controller;
};

/** Meta line under each row title: patient + dates (API is snake_case). */
const rowMeta = (row) => {
  const range = [
    row.start_date ? `Desde ${formatDate(row.start_date)}` : '',
    row.end_date ? `hasta ${formatDate(row.end_date)}` : '',
  ].filter(Boolean).join(' ');
  return `
    <p class="text-sm text-muted">
      Paciente: <span class="font-medium text-foreground">${escapeHtml(row.patient_first_name || '')} ${escapeHtml(row.patient_last_name || '')}</span>
      ${range ? `<span aria-hidden="true"> · </span>${range}` : ''}
    </p>
  `;
};

/* ------------------------------------------------------------------ */
/*  Treatments                                                         */
/* ------------------------------------------------------------------ */

export const renderTreatments = () => ProfessionalLayout({
  active: 'treatments',
  breadcrumbs: [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Tratamientos' }],
  content: sectionShell({
    title: 'Tratamientos',
    description: 'Planes de tratamiento que has creado para tus pacientes.',
    createLabel: 'Nuevo tratamiento',
    filtersHtml: FilterSelect({ id: 'filter-status', label: 'Estado', options: statusFilterOptions }),
  }),
});

const treatmentFormFields = (patientOptions, row = null) => `
  ${row ? '' : Select({ name: 'patientId', label: 'Paciente', options: patientOptions, required: true })}
  ${Input({ name: 'title', label: 'Título', required: true, value: row?.title || '' })}
  ${Textarea({ name: 'description', label: 'Descripción', rows: 4, required: true, value: row?.description || '' })}
  ${Input({ name: 'startDate', label: 'Fecha de inicio', type: 'date', value: row?.start_date?.slice(0, 10) || '' })}
  ${Input({ name: 'endDate', label: 'Fecha de término', type: 'date', value: row?.end_date?.slice(0, 10) || '' })}
  ${row ? statusEditSelect(row.status) : ''}
`;

export const mountTreatments = () => {
  mountProfessionalLayout();
  let rows = [];

  mountSection({
    emptyTitle: 'Sin tratamientos',
    emptyDescription: 'Crea el primer plan de tratamiento para un paciente vinculado.',
    fetcher: async (query) => {
      const result = await service.listTreatments(query);
      rows = result.data;
      return result;
    },
    renderRow: (row) => Card({
      content: `
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-medium text-foreground">${escapeHtml(row.title)}</h2>
            ${rowMeta(row)}
            ${row.description ? `<p class="mt-2 text-sm text-muted text-pretty">${escapeHtml(row.description)}</p>` : ''}
          </div>
          <div class="flex items-center gap-3">
            ${StatusBadge(row.status)}
            ${Button({ label: 'Editar', variant: 'ghost', size: 'sm', attrs: `data-edit="${row.id}"` })}
          </div>
        </div>
      `,
    }),
    onCreate: async (controller) => {
      const patients = await loadPatientOptions();
      if (!patients.length) {
        showToast('Vincula un paciente antes de crear tratamientos.', 'info');
        return;
      }
      openFormModal({
        title: 'Nuevo tratamiento',
        submitLabel: 'Crear tratamiento',
        formHtml: treatmentFormFields(patients),
        onSubmit: async (values) => {
          await service.createTreatment(values);
          showToast('Tratamiento creado.', 'success');
          controller.load();
        },
      });
    },
    onEdit: (id, controller) => {
      /* API ids are BIGSERIAL strings — compare as strings. */
      const row = rows.find((r) => String(r.id) === id);
      if (!row) return;
      openFormModal({
        title: 'Editar tratamiento',
        submitLabel: 'Guardar cambios',
        formHtml: treatmentFormFields(null, row),
        onSubmit: async (values) => {
          await service.updateTreatment(row.id, values);
          showToast('Tratamiento actualizado.', 'success');
          controller.load();
        },
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Prescriptions (medications)                                        */
/* ------------------------------------------------------------------ */

export const renderMedications = () => ProfessionalLayout({
  active: 'medications',
  breadcrumbs: [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Medicación' }],
  content: sectionShell({
    title: 'Medicación',
    description: 'Prescripciones activas e históricas de tus pacientes.',
    createLabel: 'Nueva prescripción',
    filtersHtml: FilterSelect({ id: 'filter-status', label: 'Estado', options: statusFilterOptions }),
  }),
});

export const mountMedications = () => {
  mountProfessionalLayout();
  let rows = [];

  mountSection({
    emptyTitle: 'Sin prescripciones',
    emptyDescription: 'Prescribe un medicamento del catálogo a un paciente vinculado.',
    fetcher: async (query) => {
      const result = await service.listPrescriptions(query);
      rows = result.data;
      return result;
    },
    renderRow: (row) => Card({
      content: `
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-medium text-foreground">${escapeHtml(row.medication_name || 'Medicamento')}</h2>
            ${rowMeta(row)}
            <p class="mt-2 text-sm text-muted">
              <span class="font-medium text-foreground">${escapeHtml(row.dosage)}</span>
              <span aria-hidden="true"> · </span>${escapeHtml(row.frequency)}
            </p>
            ${row.instructions ? `<p class="mt-1 text-sm text-muted text-pretty">${escapeHtml(row.instructions)}</p>` : ''}
          </div>
          <div class="flex items-center gap-3">
            ${StatusBadge(row.status)}
            ${Button({ label: 'Editar', variant: 'ghost', size: 'sm', attrs: `data-edit="${row.id}"` })}
          </div>
        </div>
      `,
    }),
    onCreate: async (controller) => {
      const [patients, catalog] = await Promise.all([
        loadPatientOptions(),
        service.listMedicationCatalog(),
      ]);
      if (!patients.length) {
        showToast('Vincula un paciente antes de prescribir.', 'info');
        return;
      }
      const medicationOptions = catalog.data.map((m) => ({
        value: String(m.id),
        label: m.name,
      }));
      openFormModal({
        title: 'Nueva prescripción',
        submitLabel: 'Prescribir',
        formHtml: `
          ${Select({ name: 'patientId', label: 'Paciente', options: patients, required: true })}
          ${Select({ name: 'medicationId', label: 'Medicamento', options: medicationOptions, required: true })}
          ${Input({ name: 'dosage', label: 'Dosis', required: true, placeholder: 'Ej. 500 mg' })}
          ${Input({ name: 'frequency', label: 'Frecuencia', required: true, placeholder: 'Ej. Cada 8 horas' })}
          ${Textarea({ name: 'instructions', label: 'Instrucciones', rows: 3 })}
          ${Input({ name: 'startDate', label: 'Fecha de inicio', type: 'date' })}
          ${Input({ name: 'endDate', label: 'Fecha de término', type: 'date' })}
        `,
        onSubmit: async (values) => {
          await service.createPrescription(values);
          showToast('Prescripción creada.', 'success');
          controller.load();
        },
      });
    },
    onEdit: (id, controller) => {
      const row = rows.find((r) => String(r.id) === id);
      if (!row) return;
      openFormModal({
        title: `Editar prescripción — ${escapeHtml(row.medication_name || '')}`,
        submitLabel: 'Guardar cambios',
        formHtml: `
          ${Input({ name: 'dosage', label: 'Dosis', value: row.dosage || '' })}
          ${Input({ name: 'frequency', label: 'Frecuencia', value: row.frequency || '' })}
          ${Textarea({ name: 'instructions', label: 'Instrucciones', rows: 3, value: row.instructions || '' })}
          ${Input({ name: 'endDate', label: 'Fecha de término', type: 'date', value: row.end_date?.slice(0, 10) || '' })}
          ${statusEditSelect(row.status)}
        `,
        onSubmit: async (values) => {
          await service.updatePrescription(row.id, values);
          showToast('Prescripción actualizada.', 'success');
          controller.load();
        },
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Routine assignments                                                */
/* ------------------------------------------------------------------ */

export const renderRoutines = () => ProfessionalLayout({
  active: 'routines',
  breadcrumbs: [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Rutinas' }],
  content: sectionShell({
    title: 'Rutinas',
    description: 'Rutinas de ejercicio y bienestar asignadas a tus pacientes.',
    createLabel: 'Asignar rutina',
    filtersHtml: FilterSelect({ id: 'filter-status', label: 'Estado', options: statusFilterOptions }),
  }),
});

export const mountRoutines = () => {
  mountProfessionalLayout();
  let rows = [];

  mountSection({
    emptyTitle: 'Sin rutinas asignadas',
    emptyDescription: 'Asigna una rutina del catálogo a un paciente vinculado.',
    fetcher: async (query) => {
      const result = await service.listRoutineAssignments(query);
      rows = result.data;
      return result;
    },
    renderRow: (row) => Card({
      content: `
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-medium text-foreground">${escapeHtml(row.routine_name || 'Rutina')}</h2>
            ${rowMeta(row)}
            <p class="mt-2 text-sm text-muted">
              Horario: <span class="font-medium text-foreground">${escapeHtml(row.schedule)}</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            ${StatusBadge(row.status)}
            ${Button({ label: 'Editar', variant: 'ghost', size: 'sm', attrs: `data-edit="${row.id}"` })}
          </div>
        </div>
      `,
    }),
    onCreate: async (controller) => {
      const [patients, catalog] = await Promise.all([
        loadPatientOptions(),
        service.listRoutineCatalog(),
      ]);
      if (!patients.length) {
        showToast('Vincula un paciente antes de asignar rutinas.', 'info');
        return;
      }
      const routineOptions = catalog.data.map((r) => ({
        value: String(r.id),
        label: r.type ? `${r.name} — ${r.type}` : r.name,
      }));
      openFormModal({
        title: 'Asignar rutina',
        submitLabel: 'Asignar',
        formHtml: `
          ${Select({ name: 'patientId', label: 'Paciente', options: patients, required: true })}
          ${Select({ name: 'routineId', label: 'Rutina', options: routineOptions, required: true })}
          ${Input({ name: 'schedule', label: 'Horario', required: true, placeholder: 'Ej. Lunes a viernes, 30 minutos' })}
          ${Textarea({ name: 'instructions', label: 'Instrucciones', rows: 3 })}
        `,
        onSubmit: async (values) => {
          await service.createRoutineAssignment(values);
          showToast('Rutina asignada.', 'success');
          controller.load();
        },
      });
    },
    onEdit: (id, controller) => {
      const row = rows.find((r) => String(r.id) === id);
      if (!row) return;
      openFormModal({
        title: `Editar rutina — ${escapeHtml(row.routine_name || '')}`,
        submitLabel: 'Guardar cambios',
        formHtml: `
          ${Input({ name: 'schedule', label: 'Horario', value: row.schedule || '' })}
          ${Textarea({ name: 'instructions', label: 'Instrucciones', rows: 3, value: row.instructions || '' })}
          ${statusEditSelect(row.status)}
        `,
        onSubmit: async (values) => {
          await service.updateRoutineAssignment(row.id, values);
          showToast('Rutina actualizada.', 'success');
          controller.load();
        },
      });
    },
  });
};

/* ------------------------------------------------------------------ */
/*  Observations                                                       */
/* ------------------------------------------------------------------ */

export const renderObservations = () => ProfessionalLayout({
  active: 'observations',
  breadcrumbs: [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Observaciones' }],
  content: sectionShell({
    title: 'Observaciones',
    description: 'Notas clínicas sobre tus pacientes, visibles o internas.',
    createLabel: 'Nueva observación',
    filtersHtml: '',
  }),
});

/** Visibility checkbox markup (not part of the shared Input set). */
const visibilityCheckbox = (checked) => `
  <label class="flex items-center gap-2 text-sm text-foreground">
    <input type="checkbox" name="visibleToPatient" value="true" ${checked ? 'checked' : ''}
      class="h-4 w-4 rounded border-black/20 text-primary focus:ring-primary" />
    Visible para el paciente
  </label>
`;

export const mountObservations = () => {
  mountProfessionalLayout();
  let rows = [];

  mountSection({
    emptyTitle: 'Sin observaciones',
    emptyDescription: 'Registra la primera nota clínica de un paciente vinculado.',
    fetcher: async (query) => {
      const result = await service.listObservations(query);
      rows = result.data;
      return result;
    },
    renderRow: (row) => Card({
      content: `
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="font-medium text-foreground">${escapeHtml(row.title)}</h2>
            <p class="text-sm text-muted">
              Paciente: <span class="font-medium text-foreground">${escapeHtml(row.patientFirstName || '')} ${escapeHtml(row.patientLastName || '')}</span>
              <span aria-hidden="true"> · </span>${formatDate(row.created_at)}
            </p>
            <p class="mt-2 text-sm text-muted text-pretty">${escapeHtml(row.content)}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${row.visible_to_patient ? 'bg-primary/10 text-primary-dark' : 'bg-black/5 text-muted'}">
              ${row.visible_to_patient ? 'Visible' : 'Interna'}
            </span>
            ${Button({ label: 'Editar', variant: 'ghost', size: 'sm', attrs: `data-edit="${row.id}"` })}
          </div>
        </div>
      `,
    }),
    onCreate: async (controller) => {
      const patients = await loadPatientOptions();
      if (!patients.length) {
        showToast('Vincula un paciente antes de crear observaciones.', 'info');
        return;
      }
      openFormModal({
        title: 'Nueva observación',
        submitLabel: 'Guardar observación',
        formHtml: `
          ${Select({ name: 'patientId', label: 'Paciente', options: patients, required: true })}
          ${Input({ name: 'title', label: 'Título', required: true })}
          ${Textarea({ name: 'content', label: 'Contenido', required: true, rows: 5 })}
          ${visibilityCheckbox(false)}
        `,
        onSubmit: async (values) => {
          await service.createObservation({ ...values, visibleToPatient: Boolean(values.visibleToPatient) });
          showToast('Observación registrada.', 'success');
          controller.load();
        },
      });
    },
    onEdit: (id, controller) => {
      const row = rows.find((r) => String(r.id) === id);
      if (!row) return;
      openFormModal({
        title: 'Editar observación',
        submitLabel: 'Guardar cambios',
        formHtml: `
          ${Input({ name: 'title', label: 'Título', value: row.title || '' })}
          ${Textarea({ name: 'content', label: 'Contenido', rows: 5, value: row.content || '' })}
          ${visibilityCheckbox(row.visible_to_patient)}
        `,
        onSubmit: async (values) => {
          await service.updateObservation(row.id, { ...values, visibleToPatient: Boolean(values.visibleToPatient) });
          showToast('Observación actualizada.', 'success');
          controller.load();
        },
      });
    },
  });
};
