/**
 * Services page: detailed description of every platform capability.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button, Breadcrumbs } from '../../components/ui.components.js';

const SERVICES = [
  {
    title: 'Seguimiento de síntomas',
    audience: 'Pacientes',
    text: 'Registra síntomas con categoría, intensidad del 1 al 10, zona corporal y descripción. Tu profesional ve la evolución completa y detecta patrones a tiempo.',
  },
  {
    title: 'Gestión de citas',
    audience: 'Pacientes y profesionales',
    text: 'Los profesionales agendan citas con motivo, lugar y duración; los pacientes las consultan, reciben recordatorios y pueden cancelarlas con antelación.',
  },
  {
    title: 'Planes de tratamiento',
    audience: 'Profesionales',
    text: 'Crea tratamientos con objetivos, instrucciones y fechas. El paciente los consulta en cualquier momento y recibe una notificación con cada actualización.',
  },
  {
    title: 'Prescripción de medicación',
    audience: 'Profesionales',
    text: 'Prescribe medicamentos del catálogo con dosis, frecuencia e instrucciones. El paciente tiene su pauta siempre visible y sin ambigüedades.',
  },
  {
    title: 'Rutinas saludables',
    audience: 'Pacientes y profesionales',
    text: 'Asigna ejercicios, fisioterapia o hábitos con horarios concretos. El paciente sabe exactamente qué hacer y cuándo hacerlo.',
  },
  {
    title: 'Observaciones clínicas',
    audience: 'Profesionales',
    text: 'Documenta la evolución del paciente. Decide qué observaciones son visibles para él y cuáles son notas internas de trabajo.',
  },
  {
    title: 'Notificaciones automáticas',
    audience: 'Pacientes y profesionales',
    text: 'Cada acción relevante — una nueva cita, un síntoma intenso, un cambio de tratamiento — genera una alerta para la persona indicada.',
  },
  {
    title: 'Panel clínico centralizado',
    audience: 'Profesionales',
    text: 'Un panel con tus pacientes activos, citas del día y síntomas recientes para priorizar tu jornada en segundos.',
  },
];

export const render = () =>
  PublicLayout(`
    <div class="mx-auto max-w-6xl px-4 py-12">
      ${Breadcrumbs({ items: [{ label: 'Inicio', href: ROUTES.HOME }, { label: 'Servicios' }] })}

      <div class="mx-auto mt-8 max-w-2xl text-center">
        <h1 class="text-balance text-4xl font-bold text-foreground">Nuestros servicios</h1>
        <p class="mt-4 text-pretty leading-relaxed text-muted">
          Palm Health cubre el ciclo completo del seguimiento clínico remoto. Esto es todo lo que puedes hacer en la plataforma.
        </p>
      </div>

      <div class="mt-12 grid gap-6 sm:grid-cols-2">
        ${SERVICES.map(
          (s) => `
          <article class="rounded-3xl bg-surface p-6 ring-1 ring-black/5">
            <span class="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-foreground">${s.audience}</span>
            <h2 class="mt-3 text-lg font-semibold text-foreground">${s.title}</h2>
            <p class="mt-2 text-sm leading-relaxed text-muted">${s.text}</p>
          </article>`
        ).join('')}
      </div>

      <div class="mt-14 rounded-3xl bg-primary/10 px-6 py-10 text-center">
        <h2 class="text-balance text-2xl font-bold text-foreground">¿Listo para empezar?</h2>
        <div class="mt-5 flex flex-wrap justify-center gap-3">
          ${Button({ label: 'Registrarme como paciente', href: ROUTES.REGISTER_PATIENT })}
          ${Button({ label: 'Registrarme como profesional', href: ROUTES.REGISTER_PROFESSIONAL, variant: 'outline' })}
        </div>
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Servicios — Palm Health';
};
