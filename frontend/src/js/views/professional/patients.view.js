/**
 * Assigned patients directory — /professional/patients (Part 5).
 *
 * Search by name/email/phone, filter by assignment status, paginate,
 * link a new patient by email (medical linking flow) and navigate to
 * the clinical detail. The API only ever returns patients assigned
 * to the authenticated professional.
 */

import { ROUTES, ASSIGNMENT_STATUS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDate } from '../../utils/format.util.js';
import { Avatar, Button, Input } from '../../components/ui.components.js';
import { showToast, openModal } from '../../components/feedback.components.js';
import { setSubmitting } from '../../utils/form.util.js';
import { createListController, FilterSelect } from '../../utils/list-view.util.js';
import {
  ProfessionalLayout,
  mountProfessionalLayout,
} from '../../layouts/professional.layout.js';
import { listPatients, linkPatient } from '../../services/professional.service.js';

/** One directory row linking to the patient detail. */
const PatientRow = (patient) => {
  const fullName = `${patient.first_name} ${patient.last_name}`;
  const detailHref = ROUTES.PROFESSIONAL_PATIENT_DETAIL.replace(':id', patient.id);
  return `
    <li>
      <a href="${detailHref}" data-link
        class="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-black/[.02]">
        <div class="flex min-w-0 items-center gap-3">
          ${Avatar({ name: fullName, size: 'sm' })}
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-foreground">${escapeHtml(fullName)}</p>
            <p class="truncate text-xs text-muted">${escapeHtml(patient.email || '')}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-muted">
          <span class="hidden sm:inline">Vinculado: ${formatDate(patient.assigned_at)}</span>
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </a>
    </li>
  `;
};

export const render = () =>
  ProfessionalLayout({
    active: 'patients',
    breadcrumbs: [{ label: 'Inicio', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Pacientes' }],
    content: `
      <div class="flex flex-col gap-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-balance text-foreground">Pacientes asignados</h1>
            <p class="mt-1 text-sm text-muted">Gestiona a los pacientes bajo tu cuidado.</p>
          </div>
          ${Button({ id: 'link-patient-button', label: 'Vincular paciente', size: 'sm' })}
        </header>

        <form id="patient-filters" class="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Filtros de pacientes">
          <div class="sm:col-span-2">
            ${Input({ name: 'filter-search', label: 'Buscar', type: 'search', placeholder: 'Nombre, correo o teléfono' })}
          </div>
          ${FilterSelect({
            id: 'filter-status',
            label: 'Estado de vinculación',
            options: [
              { value: ASSIGNMENT_STATUS.ACTIVE, label: 'Activa' },
              { value: ASSIGNMENT_STATUS.COMPLETED, label: 'Finalizada' },
            ],
          })}
        </form>

        <div id="patient-list" aria-live="polite"></div>
        <div id="patient-pagination"></div>
      </div>
    `,
  });

export const mount = ({ query }) => {
  mountProfessionalLayout();

  const controller = createListController({
    listNode: document.getElementById('patient-list'),
    paginationNode: document.getElementById('patient-pagination'),
    fetcher: (params) => listPatients(params),
    renderItem: PatientRow,
    empty: {
      title: 'Sin pacientes asignados',
      description: 'Vincula a tu primer paciente con su correo registrado.',
    },
  });

  /* Filters: debounced search + status select. */
  const searchInput = document.getElementById('filter-search');
  const statusSelect = document.getElementById('filter-status');
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      controller.state.filters.search = searchInput.value.trim();
      controller.state.page = 1;
      controller.load();
    }, 350);
  });
  statusSelect.addEventListener('change', () => {
    controller.state.filters.status = statusSelect.value;
    controller.state.page = 1;
    controller.load();
  });
  document.getElementById('patient-filters').addEventListener('submit', (event) => {
    event.preventDefault();
  });

  /* Medical linking modal (by registered email). */
  const openLinkModal = () => {
    const close = openModal({
      title: 'Vincular paciente',
      content: `
        <form id="link-form" class="flex flex-col gap-4" novalidate>
          <p class="text-sm leading-relaxed text-muted">
            Introduce el correo con el que el paciente se registró en Palm Health.
            El paciente recibirá una notificación de la vinculación.
          </p>
          ${Input({ name: 'linkEmail', label: 'Correo del paciente', type: 'email', required: true, placeholder: 'paciente@correo.com' })}
          ${Button({ label: 'Vincular', type: 'submit', extra: 'w-full', id: 'link-submit' })}
        </form>
      `,
    });

    const form = document.getElementById('link-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.querySelector('#linkEmail').value.trim();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        showToast('Introduce un correo válido.', 'error');
        return;
      }
      const submitButton = document.getElementById('link-submit');
      setSubmitting(submitButton, true);
      try {
        const { data } = await linkPatient(email);
        showToast(`Paciente ${data.patient.firstName} ${data.patient.lastName} vinculado.`, 'success');
        close();
        controller.load();
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });
  };

  document.getElementById('link-patient-button').addEventListener('click', openLinkModal);

  /* Quick action deep-link (?link=1 opens the modal directly). */
  if (query?.link) openLinkModal();

  controller.load();
};
