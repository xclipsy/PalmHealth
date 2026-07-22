/**
 * Patient home — dashboard summary (Part 4).
 *
 * API: GET /api/patient/dashboard (single aggregated request).
 * Sections: welcome, next appointment, treatment summary, active
 * medications, assigned professional, weekly symptom summary,
 * recent notifications teaser and quick actions.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { getState } from '../../state/store.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime, formatRelative, IntensityMeter, StatusBadge } from '../../utils/format.util.js';
import { Card, Button } from '../../components/ui.components.js';
import { Skeleton, ErrorState, EmptyState } from '../../components/feedback.components.js';
import { PatientLayout, mountPatientLayout } from '../../layouts/patient.layout.js';
import { getDashboard } from '../../services/patient.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PATIENT_DASHBOARD }, { label: 'Inicio' }];

/** Section heading helper. */
const SectionTitle = (title, href, linkLabel) => `
  <div class="mb-3 flex items-center justify-between gap-2">
    <h2 class="text-base font-semibold text-foreground">${escapeHtml(title)}</h2>
    ${href ? `<a href="${href}" data-link class="text-sm font-medium text-primary-dark hover:underline">${escapeHtml(linkLabel || 'Ver todo')}</a>` : ''}
  </div>
`;

/** Next appointment card content. */
const NextAppointment = (appointment) => {
  if (!appointment) {
    return EmptyState({
      title: 'Sin próximas citas',
      description: 'Tu profesional de salud programará tus citas y aparecerán aquí.',
    });
  }
  return Card({
    content: `
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-semibold text-primary-dark">${formatDateTime(appointment.scheduled_at)}</p>
          ${StatusBadge(appointment.status)}
        </div>
        <p class="text-sm text-foreground">${escapeHtml(appointment.reason || '')}</p>
        <p class="text-sm text-muted">
          ${escapeHtml(`${appointment.professional_first_name || ''} ${appointment.professional_last_name || ''}`.trim())}
          ${appointment.location ? ` · ${escapeHtml(appointment.location)}` : ''}
        </p>
      </div>
    `,
  });
};

/** Weekly symptom summary from the 3 most recent entries. */
const RecentSymptoms = (symptoms) => {
  if (!symptoms.length) {
    return EmptyState({
      title: 'Sin síntomas recientes',
      description: 'Registra cómo te sientes para que tu profesional pueda darte mejor seguimiento.',
      actionHtml: Button({ label: 'Registrar síntoma', href: ROUTES.PATIENT_SYMPTOMS, size: 'sm' }),
    });
  }
  return Card({
    content: `
      <ul class="flex flex-col divide-y divide-black/5">
        ${symptoms
          .map(
            (s) => `
          <li class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-foreground">${escapeHtml(s.category_name || 'Síntoma')}</span>
              <span class="text-xs text-muted">${formatRelative(s.created_at)}</span>
            </div>
            ${IntensityMeter(s.intensity)}
          </li>`
          )
          .join('')}
      </ul>
    `,
  });
};

/** Assigned professional card. */
const AssignedProfessional = (professionals) => {
  if (!professionals.length) {
    return EmptyState({
      title: 'Aún sin profesional asignado',
      description: 'Cuando un profesional te vincule con tu correo, aparecerá aquí.',
    });
  }
  return professionals
    .map((pro) =>
      Card({
        content: `
          <div class="flex flex-col gap-1">
            <p class="text-sm font-semibold text-foreground">${escapeHtml(`${pro.first_name} ${pro.last_name}`)}</p>
            <p class="text-sm text-primary-dark">${escapeHtml(pro.specialty || 'Profesional de la salud')}</p>
            ${pro.clinic_name ? `<p class="text-sm text-muted">${escapeHtml(pro.clinic_name)}</p>` : ''}
          </div>
        `,
      })
    )
    .join('');
};

/** Compact list used for treatments and medications. */
const CompactList = (items, mapItem, emptyProps) => {
  if (!items.length) return EmptyState(emptyProps);
  return Card({
    content: `<ul class="flex flex-col divide-y divide-black/5">${items.map(mapItem).join('')}</ul>`,
  });
};

/** Quick action buttons. */
const QuickActions = () => `
  <div class="flex flex-wrap gap-3">
    ${Button({ label: 'Registrar síntoma', href: ROUTES.PATIENT_SYMPTOMS, size: 'sm' })}
    ${Button({ label: 'Ver mis citas', href: ROUTES.PATIENT_APPOINTMENTS, variant: 'outline', size: 'sm' })}
    ${Button({ label: 'Mi medicación', href: ROUTES.PATIENT_MEDICATIONS, variant: 'outline', size: 'sm' })}
    ${Button({ label: 'Notificaciones', href: ROUTES.PATIENT_NOTIFICATIONS, variant: 'ghost', size: 'sm' })}
  </div>
`;

/**
 * View render: layout shell with skeletons; data arrives in mount().
 */
export const render = () => {
  const { user } = getState();
  const firstName = user?.firstName || 'Paciente';
  return PatientLayout({
    active: 'dashboard',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Hola, ${escapeHtml(firstName)}</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Este es el resumen de tu salud de hoy.</p>
        </div>
        ${QuickActions()}
        <div id="dashboard-body">
          <div class="grid gap-6 md:grid-cols-2">
            ${Card({ content: Skeleton({ lines: 4 }) })}
            ${Card({ content: Skeleton({ lines: 4 }) })}
            ${Card({ content: Skeleton({ lines: 4 }) })}
            ${Card({ content: Skeleton({ lines: 4 }) })}
          </div>
        </div>
      </div>
    `,
  });
};

/**
 * Mount: wires the layout and loads the aggregated dashboard.
 */
export const mount = () => {
  mountPatientLayout();
  const body = document.getElementById('dashboard-body');

  const load = async () => {
    try {
      const { data } = await getDashboard();
      body.innerHTML = `
        <div class="grid items-start gap-6 md:grid-cols-2">
          <section aria-labelledby="next-appointment-title">
            ${SectionTitle('Próxima cita', ROUTES.PATIENT_APPOINTMENTS)}
            ${NextAppointment(data.nextAppointment)}
          </section>
          <section aria-labelledby="professional-title">
            ${SectionTitle('Tu profesional asignado')}
            ${AssignedProfessional(data.assignedProfessionals || [])}
          </section>
          <section aria-labelledby="treatments-title">
            ${SectionTitle(`Tratamientos activos (${data.activeTreatments.total})`, ROUTES.PATIENT_TREATMENTS)}
            ${CompactList(
              data.activeTreatments.items,
              (t) => `
                <li class="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <span class="text-sm font-medium text-foreground">${escapeHtml(t.title)}</span>
                  ${StatusBadge(t.status)}
                </li>`,
              { title: 'Sin tratamientos activos', description: 'Tu profesional creará tu plan de tratamiento.' }
            )}
          </section>
          <section aria-labelledby="medications-title">
            ${SectionTitle(`Medicación activa (${data.activeMedications.total})`, ROUTES.PATIENT_MEDICATIONS)}
            ${CompactList(
              data.activeMedications.items,
              (m) => `
                <li class="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                  <span class="text-sm font-medium text-foreground">${escapeHtml(m.medication_name)}</span>
                  <span class="text-xs text-muted">${escapeHtml(m.dosage)} · ${escapeHtml(m.frequency)}</span>
                </li>`,
              { title: 'Sin medicación activa', description: 'Las prescripciones de tu profesional aparecerán aquí.' }
            )}
          </section>
          <section class="md:col-span-2" aria-labelledby="symptoms-title">
            ${SectionTitle('Resumen semanal de síntomas', ROUTES.PATIENT_SYMPTOMS, 'Ir al diario')}
            ${RecentSymptoms(data.recentSymptoms || [])}
          </section>
        </div>
      `;
    } catch (error) {
      body.innerHTML = ErrorState({ message: error.message, retryId: 'dashboard-retry' });
      document.getElementById('dashboard-retry')?.addEventListener('click', load);
    }
  };

  load();
};
