/**
 * Contact page: contact info + accessible form with client validation.
 * MVP: the form validates and confirms locally (no contact endpoint yet).
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button, Input, Textarea, Select, Breadcrumbs } from '../../components/ui.components.js';
import { showToast } from '../../components/feedback.components.js';
import { validateEmail, validateRequired, collectErrors } from '../../validators/form.validators.js';
import { readForm, clearFieldErrors, applyFieldErrors, setSubmitting } from '../../utils/form.util.js';

const TOPICS = [
  { value: 'soporte', label: 'Soporte técnico' },
  { value: 'cuenta', label: 'Mi cuenta' },
  { value: 'privacidad', label: 'Privacidad y datos' },
  { value: 'profesionales', label: 'Soy profesional de la salud' },
  { value: 'otro', label: 'Otro' },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-6xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Contacto' }] })}

      <div class="mt-8 grid gap-10 lg:grid-cols-5">
        <section class="flex flex-col gap-6 lg:col-span-2">
          <h1 class="text-balance text-4xl font-bold text-foreground">Hablemos</h1>
          <p class="text-pretty leading-relaxed text-muted">
            ¿Tienes dudas, sugerencias o necesitas ayuda con tu cuenta? Escríbenos y el equipo de Palm Health te responderá lo antes posible.
          </p>
          <dl class="flex flex-col gap-4">
            <div class="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
              <dt class="text-xs font-semibold uppercase tracking-wide text-muted">Correo</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">soporte@palmhealth.app</dd>
            </div>
            <div class="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
              <dt class="text-xs font-semibold uppercase tracking-wide text-muted">Horario de atención</dt>
              <dd class="mt-1 text-sm font-medium text-foreground">Lunes a viernes, 9:00 — 18:00</dd>
            </div>
            <div class="rounded-2xl bg-warning/20 p-4 ring-1 ring-warning/40">
              <dt class="text-xs font-semibold uppercase tracking-wide text-foreground">Importante</dt>
              <dd class="mt-1 text-sm leading-relaxed text-foreground">Este canal no atiende emergencias médicas. Ante una urgencia, contacta a los servicios de emergencia locales.</dd>
            </div>
          </dl>
        </section>

        <section class="lg:col-span-3" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" class="sr-only">Formulario de contacto</h2>
          <form id="contact-form" novalidate class="flex flex-col gap-5 rounded-3xl bg-surface p-6 ring-1 ring-black/5 sm:p-8">
            <div class="grid gap-5 sm:grid-cols-2">
              ${Input({ name: 'name', label: 'Nombre completo', placeholder: 'Tu nombre', required: true, autocomplete: 'name' })}
              ${Input({ name: 'email', label: 'Correo electrónico', type: 'email', placeholder: 'tucorreo@ejemplo.com', required: true, autocomplete: 'email' })}
            </div>
            ${Select({ name: 'topic', label: 'Tema', options: TOPICS, required: true })}
            ${Textarea({ name: 'message', label: 'Mensaje', placeholder: 'Cuéntanos en qué podemos ayudarte…', required: true, rows: 5 })}
            ${Button({ label: 'Enviar mensaje', type: 'submit', id: 'contact-submit', size: 'lg' })}
          </form>
        </section>
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Contacto — Palm Health';

  const form = document.getElementById('contact-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(form);

    const values = readForm(form);
    const { valid, errors } = collectErrors({
      name: validateRequired(values.name, 'El nombre'),
      email: validateEmail(values.email),
      topic: validateRequired(values.topic, 'El tema'),
      message: validateRequired(values.message, 'El mensaje'),
    });

    if (!valid) {
      applyFieldErrors(errors);
      return;
    }

    const button = document.getElementById('contact-submit');
    setSubmitting(button, true, 'Enviando…');
    // MVP: no backend contact endpoint yet — confirm locally.
    setTimeout(() => {
      setSubmitting(button, false);
      form.reset();
      showToast('Mensaje enviado. Te responderemos pronto.', 'success');
    }, 600);
  });
};
