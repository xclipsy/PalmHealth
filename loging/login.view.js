/**
 * Login page — consumes POST /api/auth/login and redirects by role.
 */

import { ROUTES, USER_ROLES } from '../../constants/app.constants.js';
import { AuthLayout } from '../../layouts/auth.layout.js';
import { Button, Input } from '../../components/ui.components.js';
import { showToast } from '../../components/feedback.components.js';
import { login } from '../../services/auth.service.js';
import { router } from '../../router/router.js';
import { validateEmail, validateRequired, collectErrors } from '../../validators/form.validators.js';
import { readForm, clearFieldErrors, applyFieldErrors, applyApiErrors, setSubmitting } from '../../utils/form.util.js';

export const render = () =>
  AuthLayout({
    title: 'Inicia sesión',
    subtitle: 'Accede a tu cuenta de Palm Health.',
    content: `
      <form id="login-form" novalidate class="flex flex-col gap-5">
        ${Input({ name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@ejemplo.com', required: true, autocomplete: 'email' })}
        ${Input({ name: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'current-password' })}
        <div class="text-right">
          <a href="${ROUTES.FORGOT_PASSWORD}" data-link class="text-sm font-medium text-primary-dark hover:underline">¿Olvidaste tu contraseña?</a>
        </div>
        ${Button({ label: 'Entrar', type: 'submit', id: 'login-submit', size: 'lg', extra: 'w-full' })}
      </form>
      <p class="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?
        <a href="${ROUTES.REGISTER_PATIENT}" data-link class="font-medium text-primary-dark hover:underline">Regístrate como paciente</a>
        o
        <a href="${ROUTES.REGISTER_PROFESSIONAL}" data-link class="font-medium text-primary-dark hover:underline">como profesional</a>.
      </p>
    `,
  });

export const mount = () => {
  document.title = 'Iniciar sesión — Palm Health';
  const form = document.getElementById('login-form');
  document.getElementById('email').focus();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const { valid, errors } = collectErrors({
      email: validateEmail(values.email),
      password: validateRequired(values.password, 'La contraseña'),
    });
    if (!valid) {
      applyFieldErrors(errors);
      return;
    }

    const button = document.getElementById('login-submit');
    setSubmitting(button, true, 'Entrando…');
    try {
      const user = await login({ email: values.email, password: values.password });
      showToast(`Bienvenido, ${user.firstName}.`, 'success');
      router.replace(
        user.role === USER_ROLES.PROFESSIONAL ? ROUTES.PROFESSIONAL_DASHBOARD : ROUTES.PATIENT_DASHBOARD
      );
    } catch (error) {
      setSubmitting(button, false);
      applyApiErrors(error.errors);
      showToast(error.message, 'error');
    }
  });
};
