/**
 * Professional settings — notification preferences, language and
 * theme (mirror of the patient view, Part 5).
 *
 * API:
 *   GET /api/professional/settings
 *   PUT /api/professional/settings
 */

import { ROUTES } from '../../constants/app.constants.js';
import { Card, Button } from '../../components/ui.components.js';
import { Skeleton, ErrorState, showToast } from '../../components/feedback.components.js';
import { ProfessionalLayout, mountProfessionalLayout } from '../../layouts/professional.layout.js';
import { setSubmitting, applyApiErrors } from '../../utils/form.util.js';
import { getSettings, updateSettings } from '../../services/professional.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Preferencias' }];

/** Accessible toggle row (checkbox styled as switch). */
const ToggleRow = ({ name, label, description, checked }) => `
  <label class="flex cursor-pointer items-start justify-between gap-4 py-3" for="${name}">
    <span class="flex flex-col gap-0.5">
      <span class="text-sm font-medium text-foreground">${label}</span>
      <span class="text-xs text-muted">${description}</span>
    </span>
    <input id="${name}" name="${name}" type="checkbox" ${checked ? 'checked' : ''}
      class="mt-0.5 h-5 w-5 shrink-0 rounded accent-[#4c9e8a]" />
  </label>
`;

/** Settings form once data is available. */
const SettingsContent = (settings) => `
  <form id="settings-form" class="flex flex-col gap-6">
    ${Card({
      content: `
        <h2 class="mb-2 text-base font-semibold text-foreground">Notificaciones</h2>
        <div class="flex flex-col divide-y divide-black/5">
          ${ToggleRow({
            name: 'notificationsEnabled',
            label: 'Notificaciones en la plataforma',
            description: 'Recibe avisos sobre síntomas nuevos, citas y pacientes vinculados.',
            checked: settings.notifications_enabled !== false,
          })}
          ${ToggleRow({
            name: 'emailNotifications',
            label: 'Notificaciones por correo',
            description: 'Además del panel, recibe los avisos importantes por correo electrónico.',
            checked: settings.email_notifications === true,
          })}
        </div>
      `,
    })}
    ${Card({
      content: `
        <h2 class="mb-2 text-base font-semibold text-foreground">Idioma y apariencia</h2>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label for="language" class="text-sm font-medium text-foreground">Idioma</label>
            <select id="language" name="language"
              class="w-full max-w-xs rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="es" ${settings.language !== 'en' ? 'selected' : ''}>Español</option>
              <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English (próximamente)</option>
            </select>
            <p class="text-xs text-muted">La traducción completa estará disponible en una próxima versión.</p>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="theme" class="text-sm font-medium text-foreground">Tema</label>
            <select id="theme" name="theme"
              class="w-full max-w-xs rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="light" ${settings.theme !== 'dark' ? 'selected' : ''}>Claro</option>
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Oscuro (próximamente)</option>
            </select>
            <p class="text-xs text-muted">El modo oscuro llegará en una próxima versión; tu preferencia se guarda desde ahora.</p>
          </div>
        </div>
      `,
    })}
    ${Button({ label: 'Guardar preferencias', type: 'submit', id: 'settings-submit', extra: 'self-start' })}
  </form>
`;

export const render = () =>
  ProfessionalLayout({
    active: 'settings',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Preferencias</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Configura cómo quieres usar Palm Health.</p>
        </div>
        <div id="settings-body">${Card({ content: Skeleton({ lines: 6 }) })}</div>
      </div>
    `,
  });

export const mount = () => {
  mountProfessionalLayout();
  const body = document.getElementById('settings-body');

  const load = async () => {
    try {
      const { data } = await getSettings();
      body.innerHTML = SettingsContent(data);
      wireForm();
    } catch (error) {
      body.innerHTML = ErrorState({ message: error.message, retryId: 'settings-retry' });
      document.getElementById('settings-retry')?.addEventListener('click', load);
    }
  };

  const wireForm = () => {
    const form = document.getElementById('settings-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = document.getElementById('settings-submit');
      setSubmitting(submitButton, true);
      try {
        await updateSettings({
          notificationsEnabled: form.querySelector('#notificationsEnabled').checked,
          emailNotifications: form.querySelector('#emailNotifications').checked,
          language: form.querySelector('#language').value,
          theme: form.querySelector('#theme').value,
        });
        showToast('Preferencias guardadas correctamente.', 'success');
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
