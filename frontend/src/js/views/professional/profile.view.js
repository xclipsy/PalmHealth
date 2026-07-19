/**
 * Professional profile — view account data and edit the allowed
 * fields (Part 5: phone, specialty, years of experience, clinic).
 *
 * API:
 *   GET /api/professional/profile
 *   PUT /api/professional/profile
 *
 * Password changes reuse the secure reset flow (/forgot-password).
 */

import { ROUTES } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDate } from '../../utils/format.util.js';
import { Card, Button, Input, Avatar } from '../../components/ui.components.js';
import { Skeleton, ErrorState, showToast } from '../../components/feedback.components.js';
import { ProfessionalLayout, mountProfessionalLayout } from '../../layouts/professional.layout.js';
import { readForm, clearFieldErrors, applyApiErrors, setSubmitting } from '../../utils/form.util.js';
import { getProfile, updateProfile } from '../../services/professional.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Mi perfil' }];

/** Read-only info row. */
const InfoRow = (label, value) => `
  <div class="flex flex-col gap-0.5">
    <dt class="text-xs font-medium uppercase tracking-wide text-muted">${escapeHtml(label)}</dt>
    <dd class="text-sm text-foreground">${escapeHtml(String(value ?? '—'))}</dd>
  </div>
`;

/** Full profile page content once data is loaded. */
const ProfileContent = (profile) => {
  const fullName = `${profile.first_name} ${profile.last_name}`;
  return `
    <div class="grid items-start gap-6 lg:grid-cols-5">
      <div class="flex flex-col gap-6 lg:col-span-2">
        ${Card({
          content: `
            <div class="flex flex-col items-center gap-3 text-center">
              ${Avatar({ name: fullName, size: 'lg' })}
              <div>
                <h2 class="text-lg font-semibold text-foreground">${escapeHtml(fullName)}</h2>
                <p class="text-sm text-muted">${escapeHtml(profile.email || '')}</p>
              </div>
              <span class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-success/40">Cuenta profesional</span>
            </div>
          `,
        })}
        ${Card({
          content: `
            <h3 class="mb-4 text-base font-semibold text-foreground">Datos de la cuenta</h3>
            <dl class="flex flex-col gap-3">
              ${InfoRow('Nombre completo', fullName)}
              ${InfoRow('Correo electrónico', profile.email)}
              ${InfoRow('Cédula profesional', profile.license_number)}
              ${InfoRow('Miembro desde', formatDate(profile.created_at))}
            </dl>
            <div class="mt-4 border-t border-black/5 pt-4">
              <p class="mb-3 text-sm text-muted">Para cambiar tu contraseña usamos el proceso seguro de restablecimiento por correo.</p>
              ${Button({ label: 'Cambiar contraseña', href: ROUTES.FORGOT_PASSWORD, variant: 'outline', size: 'sm' })}
            </div>
          `,
        })}
      </div>

      <div class="lg:col-span-3">
        ${Card({
          content: `
            <h3 class="mb-1 text-base font-semibold text-foreground">Información profesional</h3>
            <p class="mb-5 text-sm text-muted">Estos campos son visibles para tus pacientes vinculados. La cédula profesional no puede modificarse.</p>
            <form id="profile-form" novalidate class="flex flex-col gap-4">
              ${Input({ name: 'phone', label: 'Teléfono', type: 'tel', value: profile.phone || '', autocomplete: 'tel', placeholder: 'Ej. 555 123 4567' })}
              ${Input({ name: 'specialty', label: 'Especialidad', value: profile.specialty || '', placeholder: 'Ej. Medicina interna' })}
              ${Input({ name: 'yearsExperience', label: 'Años de experiencia', type: 'number', value: profile.years_experience ?? '', placeholder: 'Ej. 10' })}
              ${Input({ name: 'clinicName', label: 'Clínica o consultorio', value: profile.clinic_name || '', placeholder: 'Ej. Clínica Central' })}
              ${Button({ label: 'Guardar cambios', type: 'submit', id: 'profile-submit', extra: 'self-start' })}
            </form>
          `,
        })}
      </div>
    </div>
  `;
};

export const render = () =>
  ProfessionalLayout({
    active: 'profile',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Mi perfil</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Consulta tu información y mantén tus datos profesionales al día.</p>
        </div>
        <div id="profile-body">${Card({ content: Skeleton({ lines: 8 }) })}</div>
      </div>
    `,
  });

export const mount = () => {
  mountProfessionalLayout();
  const body = document.getElementById('profile-body');

  const load = async () => {
    try {
      const { data } = await getProfile();
      body.innerHTML = ProfileContent(data);
      wireForm();
    } catch (error) {
      body.innerHTML = ErrorState({ message: error.message, retryId: 'profile-retry' });
      document.getElementById('profile-retry')?.addEventListener('click', load);
    }
  };

  const wireForm = () => {
    const form = document.getElementById('profile-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(form);
      const values = readForm(form);
      const submitButton = document.getElementById('profile-submit');
      setSubmitting(submitButton, true);
      try {
        await updateProfile({
          phone: values.phone || undefined,
          specialty: values.specialty || undefined,
          yearsExperience: values.yearsExperience === '' ? undefined : Number(values.yearsExperience),
          clinicName: values.clinicName || undefined,
        });
        showToast('Perfil actualizado correctamente.', 'success');
      } catch (error) {
        applyApiErrors(error.errors);
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });
  };

  load();
};
