/**
 * Terms and Conditions page (public legal content).
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Breadcrumbs } from '../../components/ui.components.js';

const SECTIONS = [
  {
    title: '1. Objeto del servicio',
    body: 'Palm Health es una plataforma digital de seguimiento clínico que facilita la comunicación entre pacientes y profesionales de la salud. El uso de la plataforma implica la aceptación de estos términos.',
  },
  {
    title: '2. Naturaleza no urgente del servicio',
    body: 'Palm Health NO es un servicio de emergencias ni sustituye la consulta médica presencial. Ante cualquier urgencia médica, el usuario debe contactar de inmediato con los servicios de emergencia de su localidad.',
  },
  {
    title: '3. Registro y veracidad',
    body: 'Para usar la plataforma es necesario crear una cuenta con información veraz y actualizada. Los profesionales declaran contar con la titulación y licencia declaradas en su registro y son responsables de su exactitud.',
  },
  {
    title: '4. Uso responsable',
    body: 'El usuario se compromete a usar la plataforma de forma lícita, a no acceder a información de terceros, a no interferir con el funcionamiento del servicio y a mantener la confidencialidad de sus credenciales de acceso.',
  },
  {
    title: '5. Responsabilidad clínica',
    body: 'Las decisiones clínicas (tratamientos, medicación, rutinas) son responsabilidad exclusiva del profesional de la salud que las emite. Palm Health provee la infraestructura de comunicación, pero no presta servicios médicos ni valida el contenido clínico.',
  },
  {
    title: '6. Disponibilidad',
    body: 'Trabajamos para mantener el servicio disponible de forma continua, aunque pueden producirse interrupciones por mantenimiento o causas ajenas. La plataforma se ofrece "tal cual" durante su etapa inicial.',
  },
  {
    title: '7. Suspensión de cuentas',
    body: 'Palm Health puede suspender cuentas que incumplan estos términos, hagan un uso fraudulento del servicio o pongan en riesgo la seguridad de otros usuarios.',
  },
  {
    title: '8. Modificaciones',
    body: 'Estos términos pueden actualizarse. Los cambios sustanciales se comunicarán dentro de la plataforma y el uso continuado del servicio implicará su aceptación.',
  },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-3xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Términos y condiciones' }] })}
      <h1 class="mt-8 text-balance text-4xl font-bold text-foreground">Términos y condiciones</h1>
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
  document.title = 'Términos y condiciones — Palm Health';
};
