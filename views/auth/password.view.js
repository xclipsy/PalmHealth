/**
 * Password recovery views: Forgot Password, Reset Password and
 * Email Verification placeholder. Grouped because they share the
 * AuthLayout and the recovery flow.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { AuthLayout } from '../../layouts/auth.layout.js';
import { Button, Input, Alert } from '../../components/ui.components.js';
import { showToast } from '../../components/feedback.components.js';
import { forgotPassword, resetPassword } from '../../services/auth.service.js';
import { router } from '../../router/router.js';
import { validateEmail, validatePassword, validatePasswordConfirmation, collectErrors } from '../../validators/form.validators.js';
import { readForm, clearFieldErrors, applyFieldErrors, setSubmitting } from '../../utils/form.util.js';

/* ------------------------- Forgot password ------------------------ */

export const renderForgot = () =>
  AuthLayout({
    title: 'Recuperar contraseña',
    subtitle: 'Ingresa tu correo y te enviaremos instrucciones para restablecerla.',
    content: `
      <form id="forgot-form" novalidate class="flex flex-col gap-5">
        ${Input({ name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@ejemplo.com', required: true, autocomplete: 'email' })}
        ${Button({ label: 'Enviar instrucciones', type: 'submit', id: 'forgot-submit', size: 'lg', extra: 'w-full' })}
      </form>
      <p class="mt-6 text-center text-sm text-muted">
        <a href="${ROUTES.LOGIN}" data-link class="font-medium text-primary-dark hover:underline">Volver a iniciar sesión</a>
      </p>
    `,
  });

export const mountForgot = () => {
  document.title = 'Recuperar contraseña — Palm Health';
  const form = document.getElementById('forgot-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const { valid, errors } = collectErrors({ email: validateEmail(values.email) });
    if (!valid) {
      applyFieldErrors(errors);
      return;
    }

    const button = document.getElementById('forgot-submit');
    setSubmitting(button, true, 'Enviando…');
    try {
      const message = await forgotPassword(values.email);
      form.outerHTML = Alert({ message, variant: 'success' });
    } catch (error) {
      setSubmitting(button, false);
      showToast(error.message, 'error');
    }
  });
};

/* -------------------------- Reset password ------------------------ */

export const renderReset = () =>
  AuthLayout({
    title: 'Nueva contraseña',
    subtitle: 'Define una nueva contraseña segura para tu cuenta.',
    content: `
      <form id="reset-form" novalidate class="flex flex-col gap-5">
        ${Input({ name: 'password', label: 'Nueva contraseña', type: 'password', required: true, autocomplete: 'new-password', hint: 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.' })}
        ${Input({ name: 'passwordConfirmation', label: 'Confirmar contraseña', type: 'password', required: true, autocomplete: 'new-password' })}
        ${Button({ label: 'Restablecer contraseña', type: 'submit', id: 'reset-submit', size: 'lg', extra: 'w-full' })}
      </form>
    `,
  });

export const mountReset = () => {
  document.title = 'Nueva contraseña — Palm Health';
  const form = document.getElementById('reset-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const { valid, errors } = collectErrors({
      password: validatePassword(values.password),
      passwordConfirmation: validatePasswordConfirmation(values.password, values.passwordConfirmation),
    });
    if (!valid) {
      applyFieldErrors(errors);
      return;
    }

    const button = document.getElementById('reset-submit');
    setSubmitting(button, true, 'Guardando…');
    const message = await resetPassword(values);
    form.outerHTML = `
      ${Alert({ message, variant: 'info' })}
      <div class="mt-4 text-center">${Button({ label: 'Ir a iniciar sesión', href: ROUTES.LOGIN })}</div>
    `;
  });
};

/* --------------------- Email verification stub -------------------- */

export const renderVerify = () =>
  AuthLayout({
    title: 'Verificación de correo',
    subtitle: '',
    content: `
      ${Alert({ message: 'La verificación de correo estará disponible próximamente. Tu cuenta ya está activa y puedes usar la plataforma con normalidad.', variant: 'info' })}
      <div class="mt-6 text-center">${Button({ label: 'Ir a iniciar sesión', href: ROUTES.LOGIN })}</div>
    `,
  });

export const mountVerify = () => {
  document.title = 'Verificación de correo — Palm Health';
};
