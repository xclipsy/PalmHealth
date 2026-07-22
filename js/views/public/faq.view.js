/**
 * FAQ page: full accordion of frequently asked questions.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button, Breadcrumbs } from '../../components/ui.components.js';

const FAQ_GROUPS = [
  {
    group: 'General',
    items: [
      { q: '¿Qué es Palm Health?', a: 'Una plataforma de salud digital que conecta pacientes y profesionales para el seguimiento clínico remoto: síntomas, citas, tratamientos, medicación, rutinas y observaciones en un solo lugar.' },
      { q: '¿Palm Health tiene costo?', a: 'El registro y las funciones principales son gratuitas para pacientes y profesionales durante la etapa inicial de la plataforma.' },
      { q: '¿Reemplaza las consultas médicas?', a: 'No. Palm Health complementa la atención presencial con seguimiento continuo, pero nunca sustituye una consulta médica ni la atención de urgencias. Ante una emergencia, contacta a los servicios de urgencia.' },
      { q: '¿Desde qué dispositivos puedo usarla?', a: 'Desde cualquier navegador moderno en computadora, tablet o teléfono. El diseño se adapta a todas las pantallas.' },
    ],
  },
  {
    group: 'Pacientes',
    items: [
      { q: '¿Cómo me conecto con mi médico?', a: 'Tu profesional te vincula desde su panel usando el correo con el que te registraste. A partir de ese momento puede ver tus síntomas y asignarte tratamientos.' },
      { q: '¿Quién puede ver mis síntomas?', a: 'Solo los profesionales que te tienen asignado como paciente. Nadie más tiene acceso a tu información clínica.' },
      { q: '¿Puedo cancelar una cita?', a: 'Sí, puedes cancelar cualquier cita programada desde tu panel. Tu profesional recibirá una notificación automática.' },
      { q: '¿Puedo editar un síntoma que registré?', a: 'Sí, puedes editar o eliminar tus propios registros de síntomas en cualquier momento.' },
    ],
  },
  {
    group: 'Profesionales',
    items: [
      { q: '¿Qué necesito para registrarme como profesional?', a: 'Tu nombre, correo, número de licencia o colegiatura profesional y tu especialidad. La cuenta queda activa de inmediato en esta etapa de la plataforma.' },
      { q: '¿Cuántos pacientes puedo gestionar?', a: 'No hay límite. Tu panel muestra a todos tus pacientes activos con su actividad reciente para ayudarte a priorizar.' },
      { q: '¿Los pacientes ven todas mis observaciones?', a: 'No. Al crear una observación decides si es visible para el paciente o si queda como nota interna de trabajo.' },
    ],
  },
  {
    group: 'Seguridad y privacidad',
    items: [
      { q: '¿Cómo protegen mis datos?', a: 'Usamos autenticación con tokens JWT, contraseñas cifradas con bcrypt y validación estricta de acceso: cada usuario solo puede ver la información que le corresponde.' },
      { q: '¿Puedo eliminar mi cuenta?', a: 'Sí. Puedes solicitar la eliminación de tu cuenta y tus datos desde la sección de contacto. Procesamos las solicitudes conforme a nuestra política de privacidad.' },
    ],
  },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-3xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Preguntas frecuentes' }] })}

      <h1 class="mt-8 text-balance text-center text-4xl font-bold text-foreground">Preguntas frecuentes</h1>
      <p class="mt-4 text-pretty text-center leading-relaxed text-muted">Todo lo que necesitas saber sobre Palm Health. ¿No encuentras tu respuesta? <a href="${ROUTES.CONTACT}" data-link class="font-medium text-primary-dark underline">Contáctanos</a>.</p>

      ${FAQ_GROUPS.map(
        (section) => `
        <section class="mt-10" aria-labelledby="faq-${section.group}">
          <h2 id="faq-${section.group}" class="text-xl font-semibold text-foreground">${section.group}</h2>
          <div class="mt-4 flex flex-col gap-3">
            ${section.items
              .map(
                (item) => `
                <details class="group rounded-2xl bg-surface p-5 ring-1 ring-black/5">
                  <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground">
                    ${item.q}
                    <span class="shrink-0 text-primary-dark transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p class="mt-3 text-sm leading-relaxed text-muted">${item.a}</p>
                </details>`
              )
              .join('')}
          </div>
        </section>`
      ).join('')}

      <div class="mt-12 text-center">
        ${Button({ label: 'Hacer otra pregunta', href: ROUTES.CONTACT, variant: 'outline' })}
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Preguntas frecuentes — Palm Health';
};
