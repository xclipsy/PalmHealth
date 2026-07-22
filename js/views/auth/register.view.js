/**
 * Registration pages (patient + professional).
 * One module renders both variants: the route decides the role.
 * Consumes POST /api/auth/register/patient|professional.
 */

import { ROUTES, USER_ROLES } from '../../constants/app.constants.js';
import { AuthLayout } from '../../layouts/auth.layout.js';
import { Button, Input, Select } from '../../components/ui.components.js';
import { showToast } from '../../components/feedback.components.js';
import { registerPatient, registerProfessional } from '../../services/auth.service.js';
import { router } from '../../router/router.js';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
  validatePastDate,
  collectErrors,
} from '../../validators/form.validators.js';
import { readForm, clearFieldErrors, applyFieldErrors, applyApiErrors, setSubmitting } from '../../utils/form.util.js';

const GENDER_OPTIONS = [
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Otro', label: 'Otro' },
  { value: 'Prefiero no decirlo', label: 'Prefiero no decirlo' },
];

/** Role toggle shown at the top of both registration forms. */
const RoleTabs = (activeRole) => `
  <div class="mb-6 grid grid-cols-2 gap-2 rounded-full bg-background p-1 ring-1 ring-black/5" role="tablist" aria-label="Tipo de cuenta">
    <a href="${ROUTES.REGISTER_PATIENT}" data-link role="tab" aria-selected="${activeRole === USER_ROLES.PATIENT}"
      class="rounded-full px-4 py-2 text-center text-sm font-semibold ${activeRole === USER_ROLES.PATIENT ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}">
      Paciente
    </a>
    <a href="${ROUTES.REGISTER_PROFESSIONAL}" data-link role="tab" aria-selected="${activeRole === USER_ROLES.PROFESSIONAL}"
      class="rounded-full px-4 py-2 text-center text-sm font-semibold ${activeRole === USER_ROLES.PROFESSIONAL ? 'bg-accent text-white' : 'text-muted hover:text-foreground'}">
      Profesional
    </a>
  </div>
`;

/** Fields shared by both roles. */
const commonFields = () => `
  <div class="grid gap-5 sm:grid-cols-2">
    ${Input({ name: 'firstName', label: 'Nombre', placeholder: 'Tu nombre', required: true, autocomplete: 'given-name' })}
    ${Input({ name: 'lastName', label: 'Apellidos', placeholder: 'Tus apellidos', required: true, autocomplete: 'family-name' })}
  </div>
  ${Input({ name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@ejemplo.com', required: true, autocomplete: 'email' })}
  ${Input({ name: 'phone', label: 'Teléfono', type: 'tel', placeholder: '5551234567', required: true, autocomplete: 'tel' })}
  <div class="grid gap-5 sm:grid-cols-2">
    ${Input({ name: 'password', label: 'Contraseña', type: 'password', required: true, autocomplete: 'new-password', hint: 'Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.' })}
    ${Input({ name: 'passwordConfirmation', label: 'Confirmar contraseña', type: 'password', required: true, autocomplete: 'new-password' })}
  </div>
`;

const privacyField = () => `
  <label class="flex items-start gap-3 text-sm leading-relaxed text-muted">
    <input type="checkbox" id="privacyAccepted" name="privacyAccepted" value="true" required aria-required="true"
      class="mt-1 h-4 w-4 rounded border-black/20 accent-[#5aa892]" />
    <span>
      He leído y acepto la
      <a href="${ROUTES.PRIVACY}" data-link class="font-medium text-primary-dark underline">política de privacidad</a>
      y los
      <a href="${ROUTES.TERMS}" data-link class="font-medium text-primary-dark underline">términos y condiciones</a>.
      <span class="text-error" aria-hidden="true">*</span>
    </span>
  </label>
  <p id="privacyAccepted-error" class="hidden text-xs font-medium text-error" role="alert"></p>
`;

const patientForm = () => `
  ${RoleTabs(USER_ROLES.PATIENT)}
  <form id="register-form" novalidate class="flex flex-col gap-5">
    ${commonFields()}
    <div class="grid gap-5 sm:grid-cols-2">
      ${Input({ name: 'birthDate', label: 'Fecha de nacimiento', type: 'date', required: true, autocomplete: 'bday' })}
      ${Select({ name: 'gender', label: 'Género', options: GENDER_OPTIONS, required: true })}
    </div>
    ${privacyField()}
    ${Button({ label: 'Crear cuenta de paciente', type: 'submit', id: 'register-submit', size: 'lg', extra: 'w-full' })}
  </form>
`;

const professionalForm = () => `
  ${RoleTabs(USER_ROLES.PROFESSIONAL)}
  <form id="register-form" novalidate class="flex flex-col gap-5">
    ${commonFields()}
    <div class="grid gap-5 sm:grid-cols-2">
      ${Input({ name: 'licenseNumber', label: 'Número de licencia', placeholder: 'MED-12345', required: true, hint: 'Cédula o colegiatura profesional.' })}
      ${Input({ name: 'specialty', label: 'Especialidad', placeholder: 'Cardiología', required: true })}
    </div>
    ${privacyField()}
    ${Button({ label: 'Crear cuenta profesional', type: 'submit', id: 'register-submit', variant: 'secondary', size: 'lg', extra: 'w-full' })}
  </form>
`;

/**
 * @param {{ params: Object }} context - Route context; role comes from the path.
 */
export const render = () => {
  const isProfessional = window.location.pathname === ROUTES.REGISTER_PROFESSIONAL;
  return AuthLayout({
    title: isProfessional ? 'Registro profesional' : 'Crea tu cuenta',
    subtitle: isProfessional
      ? 'Gestiona el seguimiento de tus pacientes desde un solo panel.'
      : 'Empieza a llevar el control de tu salud hoy mismo.',
    content: isProfessional ? professionalForm() : patientForm(),
    maxWidth: 'max-w-2xl',
  });
};

export const mount = () => {
  const isProfessional = window.location.pathname === ROUTES.REGISTER_PROFESSIONAL;
  document.title = `${isProfessional ? 'Registro profesional' : 'Registro de paciente'} — Palm Health`;

  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const baseChecks = {
      firstName: validateRequired(values.firstName, 'El nombre'),
      lastName: validateRequired(values.lastName, 'Los apellidos'),
      email: validateEmail(values.email),
      phone: validateRequired(values.phone, 'El teléfono'),
      password: validatePassword(values.password),
      passwordConfirmation: validatePasswordConfirmation(values.password, values.passwordConfirmation),
      privacyAccepted: values.privacyAccepted ? null : 'Debes aceptar la política de privacidad.',
    };
    const roleChecks = isProfessional
      ? {
          licenseNumber: validateRequired(values.licenseNumber, 'El número de licencia'),
          specialty: validateRequired(values.specialty, 'La especialidad'),
        }
      : {
          birthDate: validatePastDate(values.birthDate),
          gender: validateRequired(values.gender, 'El género'),
        };

    const { valid, errors } = collectErrors({ ...baseChecks, ...roleChecks });
    if (!valid) {
      applyFieldErrors(errors);
      return;
    }

    const button = document.getElementById('register-submit');
    setSubmitting(button, true, 'Creando cuenta…');
    try {
      const user = isProfessional ? await registerProfessional(values) : await registerPatient(values);
      showToast(`Cuenta creada. Bienvenido, ${user.firstName}.`, 'success');
      router.replace(isProfessional ? ROUTES.PROFESSIONAL_DASHBOARD : ROUTES.PATIENT_DASHBOARD);
    } catch (error) {
      setSubmitting(button, false);
      applyApiErrors(error.errors);
      showToast(error.message, 'error');
    }
  });
};
