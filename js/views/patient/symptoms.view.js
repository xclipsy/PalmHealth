/**
 * Symptom diary — the patient's core write feature (Part 4).
 *
 * API:
 *   GET    /api/patient/symptoms            (filters + pagination)
 *   GET    /api/patient/symptoms/categories (catalog)
 *   POST   /api/patient/symptoms            (create)
 *   PUT    /api/patient/symptoms/:id        (edit own)
 *   DELETE /api/patient/symptoms/:id        (delete own)
 *
 * Filters: category, date range. Sorting: newest first (API default).
 */

import { ROUTES } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, IntensityMeter } from '../../utils/format.util.js';
import { Card, Button, Select, Input, Textarea, Pagination } from '../../components/ui.components.js';
import { Skeleton, EmptyState, ErrorState, showToast, openModal, confirmDialog } from '../../components/feedback.components.js';
import { PatientLayout, mountPatientLayout } from '../../layouts/patient.layout.js';
import { readForm, clearFieldErrors, applyFieldErrors, applyApiErrors, setSubmitting } from '../../utils/form.util.js';
import {
  listSymptoms,
  listSymptomCategories,
  createSymptom,
  updateSymptom,
  deleteSymptom,
} from '../../services/patient.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PATIENT_DASHBOARD }, { label: 'Diario de síntomas' }];
const PAGE_SIZE = 10;

/** Mutable view state (recreated on each mount). */
const createViewState = () => ({ page: 1, categoryId: '', from: '', to: '', categories: [] });

/** Renders a symptom list item with edit/delete actions. */
const SymptomItem = (symptom) => `
  <li class="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm font-semibold text-foreground">${escapeHtml(symptom.category_name || 'Síntoma')}</span>
        <span class="text-xs text-muted">${formatDateTime(symptom.created_at)}${symptom.body_zone ? ` · ${escapeHtml(symptom.body_zone)}` : ''}</span>
      </div>
      ${IntensityMeter(symptom.intensity)}
    </div>
    <p class="text-sm leading-relaxed text-foreground">${escapeHtml(symptom.description || '')}</p>
    ${symptom.notes ? `<p class="rounded-2xl bg-primary/10 px-3 py-2 text-sm text-foreground"><span class="font-medium">Nota personal:</span> ${escapeHtml(symptom.notes)}</p>` : ''}
    <div class="flex gap-2">
      <button type="button" data-edit="${symptom.id}"
        class="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/10">Editar</button>
      <button type="button" data-delete="${symptom.id}"
        class="rounded-full px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10">Eliminar</button>
    </div>
  </li>
`;

/** Symptom create/edit form HTML (used inside a modal). */
const SymptomForm = (categories, symptom = null) => `
  <form id="symptom-form" novalidate class="flex flex-col gap-4">
    ${Select({
      name: 'categoryId',
      label: 'Categoría',
      required: true,
      options: categories.map((c) => ({ value: String(c.id), label: c.name })),
    })}
    <div class="flex flex-col gap-1.5">
      <label for="intensity" class="text-sm font-medium text-foreground">Intensidad (1-10) <span class="text-error" aria-hidden="true">*</span></label>
      <input id="intensity" name="intensity" type="range" min="1" max="10" step="1"
        value="${symptom ? symptom.intensity : 5}"
        class="w-full accent-[#4c9e8a]" aria-describedby="intensity-value intensity-error" />
      <p id="intensity-value" class="text-xs font-semibold text-primary-dark" aria-live="polite">Intensidad: ${symptom ? symptom.intensity : 5}/10</p>
      <p id="intensity-error" class="hidden text-xs font-medium text-error" role="alert"></p>
    </div>
    ${Textarea({ name: 'description', label: 'Descripción', required: true, placeholder: 'Describe qué sientes, desde cuándo y cómo afecta tu día…' })}
    ${Input({ name: 'bodyZone', label: 'Zona del cuerpo (opcional)', placeholder: 'Ej. Cabeza, espalda baja…' })}
    ${Textarea({ name: 'notes', label: 'Nota personal (opcional)', rows: 2, placeholder: 'Cualquier detalle extra para ti o tu profesional…' })}
    ${Button({ label: symptom ? 'Guardar cambios' : 'Registrar síntoma', type: 'submit', extra: 'w-full', id: 'symptom-submit' })}
  </form>
`;

/**
 * View render: filters + list skeleton.
 */
export const render = () =>
  PatientLayout({
    active: 'symptoms',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-foreground text-balance">Diario de síntomas</h1>
            <p class="mt-1 text-sm leading-relaxed text-muted">Registra cómo te sientes; tu profesional recibe cada registro.</p>
          </div>
          ${Button({ label: 'Registrar síntoma', id: 'new-symptom-button', size: 'sm' })}
        </div>

        <form id="symptom-filters" class="grid gap-3 sm:grid-cols-3" aria-label="Filtros del diario">
          <div class="flex flex-col gap-1.5">
            <label for="filter-category" class="text-sm font-medium text-foreground">Categoría</label>
            <select id="filter-category" name="categoryId"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todas</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="filter-from" class="text-sm font-medium text-foreground">Desde</label>
            <input id="filter-from" name="from" type="date"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="filter-to" class="text-sm font-medium text-foreground">Hasta</label>
            <input id="filter-to" name="to" type="date"
              class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </form>

        <div id="symptom-list" aria-live="polite">${Card({ content: Skeleton({ lines: 6 }) })}</div>
        <div id="symptom-pagination"></div>
      </div>
    `,
  });

/**
 * Mount: loads categories + list, wires filters, modal CRUD and
 * pagination.
 */
export const mount = () => {
  mountPatientLayout();
  const state = createViewState();
  const listNode = document.getElementById('symptom-list');
  const paginationNode = document.getElementById('symptom-pagination');

  /* ------------------------------ Data ---------------------------- */

  const load = async () => {
    listNode.innerHTML = Card({ content: Skeleton({ lines: 6 }) });
    try {
      const { data, pagination } = await listSymptoms({
        page: state.page,
        limit: PAGE_SIZE,
        categoryId: state.categoryId,
        from: state.from,
        to: state.to,
      });

      if (!data.length) {
        listNode.innerHTML = EmptyState({
          title: 'Sin registros',
          description: state.categoryId || state.from || state.to
            ? 'No hay síntomas que coincidan con los filtros seleccionados.'
            : 'Aún no has registrado síntomas. Empieza con el botón "Registrar síntoma".',
        });
        paginationNode.innerHTML = '';
        return;
      }

      listNode.innerHTML = Card({
        content: `<ul class="flex flex-col divide-y divide-black/5">${data.map(SymptomItem).join('')}</ul>`,
      });
      paginationNode.innerHTML = Pagination({ page: pagination.page, totalPages: pagination.totalPages });
      wireListActions(data);
      wirePagination();
    } catch (error) {
      listNode.innerHTML = ErrorState({ message: error.message, retryId: 'symptoms-retry' });
      document.getElementById('symptoms-retry')?.addEventListener('click', load);
    }
  };

  /* --------------------------- Interactions ----------------------- */

  const wirePagination = () => {
    paginationNode.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        state.page = Number(button.dataset.page);
        load();
      });
    });
  };

  const wireListActions = (rows) => {
    listNode.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        /* API ids are BIGSERIAL strings — compare as strings. */
        const symptom = rows.find((row) => String(row.id) === button.dataset.edit);
        if (symptom) openSymptomModal(symptom);
      });
    });
    listNode.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        const confirmed = await confirmDialog({
          title: 'Eliminar registro',
          message: '¿Seguro que deseas eliminar este síntoma? Esta acción no se puede deshacer.',
          confirmLabel: 'Eliminar',
          danger: true,
        });
        if (!confirmed) return;
        try {
          await deleteSymptom(Number(button.dataset.delete));
          showToast('Síntoma eliminado correctamente.', 'success');
          load();
        } catch (error) {
          showToast(error.message, 'error');
        }
      });
    });
  };

  /** Opens the create/edit modal and handles submit. */
  const openSymptomModal = (symptom = null) => {
    const close = openModal({
      title: symptom ? 'Editar síntoma' : 'Registrar síntoma',
      content: SymptomForm(state.categories, symptom),
    });

    const form = document.getElementById('symptom-form');
    const intensityInput = form.querySelector('#intensity');
    const intensityValue = form.querySelector('#intensity-value');
    intensityInput.addEventListener('input', () => {
      intensityValue.textContent = `Intensidad: ${intensityInput.value}/10`;
    });

    if (symptom) {
      form.querySelector('#categoryId').value = String(symptom.category_id);
      form.querySelector('#description').value = symptom.description || '';
      form.querySelector('#bodyZone').value = symptom.body_zone || '';
      form.querySelector('#notes').value = symptom.notes || '';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      const values = readForm(form);

      const errors = {};
      if (!values.categoryId) errors.categoryId = 'Selecciona una categoría.';
      if (!values.description || values.description.length < 3) errors.description = 'Describe el síntoma (mínimo 3 caracteres).';
      if (Object.keys(errors).length) {
        applyFieldErrors(errors);
        return;
      }

      const payload = {
        categoryId: Number(values.categoryId),
        intensity: Number(values.intensity),
        description: values.description,
        bodyZone: values.bodyZone || undefined,
        notes: values.notes || undefined,
      };

      const submitButton = document.getElementById('symptom-submit');
      setSubmitting(submitButton, true);
      try {
        if (symptom) {
          await updateSymptom(symptom.id, payload);
          showToast('Síntoma actualizado correctamente.', 'success');
        } else {
          await createSymptom(payload);
          showToast('Síntoma registrado. Tu profesional fue notificado.', 'success');
        }
        close();
        load();
      } catch (error) {
        applyApiErrors(error.errors);
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });
  };

  /* ------------------------------ Wiring -------------------------- */

  document.getElementById('new-symptom-button').addEventListener('click', () => openSymptomModal());

  const filterForm = document.getElementById('symptom-filters');
  filterForm.addEventListener('change', () => {
    const values = readForm(filterForm);
    state.categoryId = values.categoryId || '';
    state.from = values.from || '';
    state.to = values.to || '';
    state.page = 1;
    load();
  });

  /* Categories catalog → filter select + modal form. */
  listSymptomCategories()
    .then(({ data }) => {
      state.categories = data;
      const select = document.getElementById('filter-category');
      data.forEach((category) => {
        const option = document.createElement('option');
        option.value = String(category.id);
        option.textContent = category.name;
        select.appendChild(option);
      });
    })
    .catch(() => showToast('No se pudieron cargar las categorías.', 'error'));

  load();
};
