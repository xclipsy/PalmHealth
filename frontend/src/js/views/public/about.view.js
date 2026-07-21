/**
 * About Us page: mission, vision and values of Palm Health.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button, Card, Breadcrumbs } from '../../components/ui.components.js';

const VALUES = [
  { title: 'Cercanía', text: 'La distancia física no debe romper la relación médico-paciente. Acercamos el seguimiento clínico al día a día.' },
  { title: 'Privacidad', text: 'Tus datos de salud son tuyos. Solo los profesionales que autorizas pueden acceder a tu información.' },
  { title: 'Claridad', text: 'Nada de jerga innecesaria: tratamientos, dosis y rutinas explicados de forma que cualquiera los entienda.' },
  { title: 'Continuidad', text: 'La salud no ocurre solo en la consulta. Acompañamos cada día entre visita y visita.' },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-6xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Sobre nosotros' }] })}

      <section class="mt-8 grid items-center gap-10 lg:grid-cols-2">
        <div class="flex flex-col gap-5">
          <h1 class="text-balance text-4xl font-bold text-foreground">Sobre Palm Health</h1>
          <p class="text-pretty leading-relaxed text-muted">
            Palm Health nace de una idea sencilla: la mayoría de los problemas de salud evolucionan <em>entre</em> consultas, cuando nadie los está observando. Nuestra plataforma mantiene esa conversación abierta.
          </p>
          <p class="text-pretty leading-relaxed text-muted">
            Los pacientes registran síntomas y siguen sus tratamientos; los profesionales observan la evolución real de cada persona y ajustan los planes a tiempo. Sin llamadas perdidas, sin papeles extraviados, sin información olvidada.
          </p>
        </div>
        <img src="/src/assets/images/logo.png" alt="Logo de Palm Health: una palmera dentro de una mano abierta sobre fondo cálido" class="mx-auto h-56 w-auto" />
      </section>

      <section class="mt-16" aria-labelledby="mission-title">
        <h2 id="mission-title" class="sr-only">Misión y visión</h2>
        <div class="grid gap-6 lg:grid-cols-2">
          ${Card({ content: `
            <h3 class="text-xl font-semibold text-primary-dark">Nuestra misión</h3>
            <p class="mt-3 text-pretty text-sm leading-relaxed text-muted">Facilitar un seguimiento clínico continuo, seguro y humano entre pacientes y profesionales de la salud, mediante tecnología accesible para todos.</p>` })}
          ${Card({ content: `
            <h3 class="text-xl font-semibold text-accent">Nuestra visión</h3>
            <p class="mt-3 text-pretty text-sm leading-relaxed text-muted">Un mundo donde ninguna señal de salud importante se pierda por falta de comunicación, y donde cada tratamiento se ajuste a la vida real del paciente.</p>` })}
        </div>
      </section>

      <section class="mt-16" aria-labelledby="values-title">
        <h2 id="values-title" class="text-balance text-center text-3xl font-bold text-foreground">Nuestros valores</h2>
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          ${VALUES.map((v) => Card({ content: `
            <h3 class="font-semibold text-foreground">${v.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">${v.text}</p>` })).join('')}
        </div>
      </section>

      <div class="mt-16 text-center">
        ${Button({ label: 'Únete a Palm Health', href: ROUTES.REGISTER_PATIENT, size: 'lg' })}
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Sobre nosotros — Palm Health';
};
