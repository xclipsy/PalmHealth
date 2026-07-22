/**
 * Privacy Policy page (public legal content).
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Breadcrumbs } from '../../components/ui.components.js';

const SECTIONS = [
  {
    title: '1. Responsable del tratamiento',
    body: 'Palm Health es la responsable del tratamiento de los datos personales recogidos a través de esta plataforma. Puedes contactarnos en soporte@palmhealth.app para cualquier asunto relacionado con tus datos.',
  },
  {
    title: '2. Datos que recopilamos',
    body: 'Recopilamos los datos que nos proporcionas al registrarte (nombre, correo, fecha de nacimiento, teléfono y, en el caso de profesionales, número de licencia y especialidad) y los datos clínicos que registras voluntariamente: síntomas, citas, tratamientos, medicación, rutinas y observaciones.',
  },
  {
    title: '3. Finalidad del tratamiento',
    body: 'Usamos tus datos exclusivamente para prestar el servicio de seguimiento clínico: conectar pacientes con sus profesionales asignados, mostrar historiales de salud y enviar notificaciones sobre la actividad de tu cuenta. No vendemos ni cedemos tus datos a terceros con fines comerciales.',
  },
  {
    title: '4. Acceso a los datos clínicos',
    body: 'Tus datos clínicos solo son visibles para ti y para los profesionales de la salud que te tienen asignado como paciente. Las observaciones marcadas como internas por un profesional no son visibles para el paciente.',
  },
  {
    title: '5. Seguridad',
    body: 'Aplicamos medidas técnicas de protección: contraseñas cifradas con algoritmos robustos, autenticación mediante tokens con caducidad, validación estricta de acceso por rol y propiedad, y comunicaciones protegidas.',
  },
  {
    title: '6. Conservación',
    body: 'Conservamos tus datos mientras tu cuenta permanezca activa. Los registros clínicos eliminados se marcan como inactivos (borrado lógico) para preservar la integridad del historial médico, conforme a las buenas prácticas sanitarias.',
  },
  {
    title: '7. Tus derechos',
    body: 'Puedes acceder, rectificar o solicitar la eliminación de tus datos personales, así como retirar tu consentimiento en cualquier momento, escribiendo a soporte@palmhealth.app. Atenderemos tu solicitud en los plazos legales aplicables.',
  },
  {
    title: '8. Cambios en esta política',
    body: 'Podremos actualizar esta política para reflejar mejoras del servicio o cambios normativos. Notificaremos los cambios relevantes dentro de la plataforma.',
  },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-3xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Política de privacidad' }] })}
      <h1 class="mt-8 text-balance text-4xl font-bold text-foreground">Política de privacidad</h1>
      <p class="mt-3 text-sm text-muted">Última actualización: julio de 2026</p>

      <div class="mt-8 flex flex-col gap-8">
        ${SECTIONS.map(
          (s) => `
          <section>
            <h2 class="text-lg font-semibold text-foreground">${s.title}</h2>
            <p class="mt-2 text-pretty text-sm leading-relaxed text-muted">${s.body}</p>
          </section>`
        ).join('')}
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Política de privacidad — Palm Health';
};
