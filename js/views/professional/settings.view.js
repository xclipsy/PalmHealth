// Vista de Preferencias del Profesional de la Salud (Notificaciones, Tema/Idioma, Seguridad y Eliminación de cuenta)
import { ROUTES } from '../../constants/app.constants.js';
import { Card, Button, Input } from '../../components/ui.components.js';
import { Skeleton, ErrorState, showToast } from '../../components/feedback.components.js';
import { ProfessionalLayout, mountProfessionalLayout } from '../../layouts/professional.layout.js';
import { setSubmitting, applyApiErrors, clearFieldErrors, readForm } from '../../utils/form.util.js';
import { getSettings, updateSettings } from '../../services/professional.service.js';
import { changePassword, deleteAccount } from '../../services/auth.service.js';
import { router } from '../../router/router.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Preferencias' }];

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

const SettingsContent = (settings) => `
  <div class="flex flex-col gap-6">
    <!-- Notificaciones en plataforma -->
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
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="theme" class="text-sm font-medium text-foreground">Tema</label>
              <select id="theme" name="theme"
                class="w-full max-w-xs rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="light" ${settings.theme !== 'dark' ? 'selected' : ''}>Claro</option>
                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Oscuro (próximamente)</option>
              </select>
            </div>
          </div>
        `,
      })}
      ${Button({ label: 'Guardar preferencias', type: 'submit', id: 'settings-submit', extra: 'self-start' })}
    </form>

    <!-- Seguridad: Cambiar Contraseña -->
    ${Card({
      content: `
        <h2 class="mb-1 text-base font-semibold text-foreground">Seguridad de la cuenta</h2>
        <p class="mb-4 text-sm text-muted">Actualiza tu contraseña de acceso profesional.</p>
        <form id="change-password-form" class="flex flex-col gap-4 max-w-md">
          ${Input({ name: 'currentPassword', label: 'Contraseña actual', type: 'password', required: true })}
          ${Input({ name: 'newPassword', label: 'Nueva contraseña', type: 'password', required: true, hint: 'Mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.' })}
          ${Input({ name: 'newPasswordConfirmation', label: 'Confirmar nueva contraseña', type: 'password', required: true })}
          ${Button({ label: 'Cambiar contraseña', type: 'submit', id: 'password-submit', variant: 'outline', size: 'sm', extra: 'self-start' })}
        </form>
      `,
    })}

    <!-- Zona de Peligro: Eliminar Cuenta -->
    ${Card({
      extra: 'border border-error/30 bg-error/5',
      content: `
        <h2 class="mb-1 text-base font-semibold text-error">Eliminar cuenta profesional</h2>
        <p class="mb-4 text-sm text-muted">Nota: Debes desvincular a todos tus pacientes antes de poder eliminar tu cuenta.</p>
        ${Button({ label: 'Eliminar mi cuenta', type: 'button', id: 'delete-account-button', variant: 'danger', size: 'sm', extra: 'self-start' })}
      `,
    })}
  </div>
`;

export const render = () =>
  ProfessionalLayout({
    active: 'settings',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Preferencias</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Configura cómo quieres usar Palm Health y gestiona la seguridad de tu cuenta.</p>
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
      wireForms();
    } catch (error) {
      body.innerHTML = ErrorState({ message: error.message, retryId: 'settings-retry' });
      document.getElementById('settings-retry')?.addEventListener('click', load);
    }
  };

  const wireForms = () => {
    // Formulario de Preferencias
    const settingsForm = document.getElementById('settings-form');
    settingsForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = document.getElementById('settings-submit');
      setSubmitting(submitButton, true);
      try {
        await updateSettings({
          notificationsEnabled: settingsForm.querySelector('#notificationsEnabled').checked,
          language: settingsForm.querySelector('#language').value,
          theme: settingsForm.querySelector('#theme').value,
        });
        showToast('Preferencias guardadas correctamente.', 'success');
      } catch (error) {
        applyApiErrors(error.errors);
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });

    // Formulario de Cambiar Contraseña
    const passwordForm = document.getElementById('change-password-form');
    passwordForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFieldErrors(passwordForm);
      const values = readForm(passwordForm);
      const submitButton = document.getElementById('password-submit');
      setSubmitting(submitButton, true);
      try {
        const message = await changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          newPasswordConfirmation: values.newPasswordConfirmation,
        });
        showToast(message || 'Contraseña actualizada correctamente.', 'success');
        passwordForm.reset();
      } catch (error) {
        applyApiErrors(error.errors);
        showToast(error.message, 'error');
      } finally {
        setSubmitting(submitButton, false);
      }
    });

    // Botón de Eliminar Cuenta
    document.getElementById('delete-account-button')?.addEventListener('click', async () => {
      if (!confirm('¿Estás seguro de que deseas eliminar tu cuenta profesional de Palm Health? Esta acción no se puede deshacer.')) {
        return;
      }
      try {
        const message = await deleteAccount();
        showToast(message || 'Tu cuenta ha sido eliminada.', 'success');
        router.replace(ROUTES.LOGIN);
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  };

  load();
};
