/**
 * Landing page (Home) — the complete public marketing page:
 * Hero, About, Features, Benefits, How It Works, Testimonials,
 * FAQ preview, CTA and Contact teaser.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button, Card } from '../../components/ui.components.js';

/* ------------------------------ data ------------------------------ */

const FEATURES = [
  { icon: 'M12 4v16m8-8H4', title: 'Registro de síntomas', text: 'Documenta cómo te sientes con intensidad, zona corporal y notas. Tu historial siempre disponible.' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Citas médicas', text: 'Consulta tus próximas citas, recibe recordatorios y gestiona cancelaciones sin llamadas.' },
  { icon: 'M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Tratamientos y medicación', text: 'Sigue tus planes de tratamiento, dosis y frecuencias prescritas por tu profesional.' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Rutinas saludables', text: 'Ejercicios y hábitos asignados a tu medida, con horarios claros y seguimiento continuo.' },
  { icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', title: 'Notificaciones inteligentes', text: 'Alertas automáticas cuando tu profesional actualiza tu plan o se acerca una cita.' },
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Privacidad garantizada', text: 'Tus datos clínicos cifrados y visibles solo para los profesionales que tú autorizas.' },
];

const BENEFITS_PATIENT = [
  'Comunica síntomas sin esperar a la próxima consulta',
  'Recordatorios de medicación y citas automáticos',
  'Historial clínico organizado y accesible',
  'Observaciones de tu profesional en tiempo real',
];

const BENEFITS_PRO = [
  'Panel con la evolución de todos tus pacientes',
  'Registra observaciones, tratamientos y rutinas en segundos',
  'Prioriza casos según síntomas recientes',
  'Menos llamadas, más seguimiento efectivo',
];

const STEPS = [
  { number: '1', title: 'Crea tu cuenta', text: 'Regístrate gratis como paciente o profesional de la salud en menos de dos minutos.' },
  { number: '2', title: 'Conecta con tu profesional', text: 'Tu médico te vincula a su panel y configura tu plan de seguimiento personalizado.' },
  { number: '3', title: 'Registra tu día a día', text: 'Documenta síntomas y sigue tus tratamientos, medicación y rutinas desde cualquier dispositivo.' },
  { number: '4', title: 'Recibe seguimiento continuo', text: 'Tu profesional revisa tu evolución y ajusta el plan. Tú recibes cada novedad al instante.' },
];

const TESTIMONIALS = [
  { name: 'María G.', role: 'Paciente con hipertensión', text: 'Antes olvidaba contarle la mitad de mis síntomas al médico. Ahora todo queda registrado y mi tratamiento se ajustó mucho mejor.' },
  { name: 'Dr. Andrés P.', role: 'Cardiólogo', text: 'Palm Health me permite ver la evolución de mis pacientes entre consultas. Detecto problemas antes de que se agraven.' },
  { name: 'Lucía R.', role: 'Paciente en fisioterapia', text: 'Las rutinas con horarios claros y los recordatorios hicieron que por fin fuera constante con mis ejercicios.' },
];

const FAQ_PREVIEW = [
  { q: '¿Palm Health tiene costo?', a: 'El registro y las funciones principales de seguimiento son gratuitas tanto para pacientes como para profesionales durante la etapa inicial de la plataforma.' },
  { q: '¿Mis datos médicos están seguros?', a: 'Sí. Usamos autenticación segura, cifrado de contraseñas y cada profesional solo puede ver a los pacientes que le han sido asignados.' },
  { q: '¿Reemplaza las consultas presenciales?', a: 'No. Palm Health complementa la atención médica con seguimiento remoto continuo, pero nunca sustituye una consulta ni la atención de urgencias.' },
];

/* ---------------------------- sections ---------------------------- */

const icon = (path) => `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="text-primary-dark">
    <path d="${path}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const HeroSection = () => `
  <section class="bg-gradient-to-b from-primary/10 to-background">
    <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:py-24 lg:grid-cols-2">
      <div class="flex flex-col items-start gap-6">
        <span class="rounded-full bg-primary/15 px-4 py-1.5 text-sm font-medium text-primary-dark">Plataforma de salud digital</span>
        <h1 class="text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl">
          Tu salud, siempre al alcance de tu <span class="text-primary-dark">mano</span>
        </h1>
        <p class="max-w-lg text-pretty text-lg leading-relaxed text-muted">
          Palm Health conecta a pacientes y profesionales de la salud para un seguimiento clínico continuo: síntomas, citas, tratamientos, medicación y rutinas en un solo lugar.
        </p>
        <div class="flex flex-wrap gap-3">
          ${Button({ label: 'Comenzar como paciente', href: ROUTES.REGISTER_PATIENT, size: 'lg' })}
          ${Button({ label: 'Soy profesional de la salud', href: ROUTES.REGISTER_PROFESSIONAL, variant: 'outline', size: 'lg' })}
        </div>
      </div>
      <div class="flex justify-center">
        <img src="/src/assets/images/hero-illustration.png" alt="Ilustración de una paciente consultando su información de salud en el teléfono mientras su médica revisa el panel clínico" class="w-full max-w-md rounded-3xl shadow-lg ring-1 ring-black/5" />
      </div>
    </div>
  </section>
`;

const AboutSection = () => `
  <section class="mx-auto max-w-6xl px-4 py-16" aria-labelledby="about-title">
    <div class="mx-auto max-w-2xl text-center">
      <h2 id="about-title" class="text-balance text-3xl font-bold text-foreground">¿Qué es Palm Health?</h2>
      <p class="mt-4 text-pretty leading-relaxed text-muted">
        Somos una plataforma de seguimiento clínico remoto. Entre consulta y consulta, tu información de salud no se pierde: los síntomas que registras llegan a tu profesional, y sus indicaciones llegan a ti — al instante, de forma segura y organizada.
      </p>
    </div>
    <div class="mt-10 grid gap-6 sm:grid-cols-3">
      ${[
        { value: '24/7', label: 'Acceso a tu información de salud' },
        { value: '2 roles', label: 'Pacientes y profesionales conectados' },
        { value: '100%', label: 'Privacidad y control de tus datos' },
      ]
        .map((stat) => Card({ content: `
          <p class="text-3xl font-bold text-primary-dark">${stat.value}</p>
          <p class="mt-1 text-sm leading-relaxed text-muted">${stat.label}</p>`, extra: 'text-center' }))
        .join('')}
    </div>
  </section>
`;

const FeaturesSection = () => `
  <section class="bg-surface" aria-labelledby="features-title">
    <div class="mx-auto max-w-6xl px-4 py-16">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="features-title" class="text-balance text-3xl font-bold text-foreground">Todo tu seguimiento en un solo lugar</h2>
        <p class="mt-4 text-pretty leading-relaxed text-muted">Funciones pensadas para que la comunicación médico-paciente fluya sin fricciones.</p>
      </div>
      <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${FEATURES.map(
          (f) => `
          <div class="rounded-3xl bg-background p-6 ring-1 ring-black/5">
            <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">${icon(f.icon)}</span>
            <h3 class="mt-4 text-lg font-semibold text-foreground">${f.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">${f.text}</p>
          </div>`
        ).join('')}
      </div>
    </div>
  </section>
`;

const BenefitsSection = () => {
  const list = (items) =>
    items
      .map(
        (item) => `
        <li class="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" class="mt-0.5 shrink-0 text-success"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="text-sm leading-relaxed text-foreground">${item}</span>
        </li>`
      )
      .join('');

  return `
    <section class="mx-auto max-w-6xl px-4 py-16" aria-labelledby="benefits-title">
      <h2 id="benefits-title" class="text-balance text-center text-3xl font-bold text-foreground">Beneficios para ambos lados de la consulta</h2>
      <div class="mt-10 grid gap-6 lg:grid-cols-2">
        ${Card({ content: `
          <h3 class="text-xl font-semibold text-primary-dark">Para pacientes</h3>
          <ul class="mt-4 flex flex-col gap-3">${list(BENEFITS_PATIENT)}</ul>
          <div class="mt-6">${Button({ label: 'Crear cuenta de paciente', href: ROUTES.REGISTER_PATIENT, size: 'sm' })}</div>` })}
        ${Card({ content: `
          <h3 class="text-xl font-semibold text-accent">Para profesionales</h3>
          <ul class="mt-4 flex flex-col gap-3">${list(BENEFITS_PRO)}</ul>
          <div class="mt-6">${Button({ label: 'Crear cuenta profesional', href: ROUTES.REGISTER_PROFESSIONAL, variant: 'secondary', size: 'sm' })}</div>` })}
      </div>
    </section>
  `;
};

const HowItWorksSection = () => `
  <section class="bg-primary/10" aria-labelledby="how-title">
    <div class="mx-auto max-w-6xl px-4 py-16">
      <h2 id="how-title" class="text-balance text-center text-3xl font-bold text-foreground">Cómo funciona</h2>
      <ol class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        ${STEPS.map(
          (step) => `
          <li class="rounded-3xl bg-surface p-6 ring-1 ring-black/5">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white" aria-hidden="true">${step.number}</span>
            <h3 class="mt-4 font-semibold text-foreground">${step.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">${step.text}</p>
          </li>`
        ).join('')}
      </ol>
    </div>
  </section>
`;

const TestimonialsSection = () => `
  <section class="mx-auto max-w-6xl px-4 py-16" aria-labelledby="testimonials-title">
    <h2 id="testimonials-title" class="text-balance text-center text-3xl font-bold text-foreground">Lo que dicen nuestros usuarios</h2>
    <div class="mt-10 grid gap-6 lg:grid-cols-3">
      ${TESTIMONIALS.map(
        (t) => `
        <figure class="flex flex-col justify-between gap-4 rounded-3xl bg-surface p-6 ring-1 ring-black/5">
          <blockquote class="text-pretty text-sm leading-relaxed text-foreground">&ldquo;${t.text}&rdquo;</blockquote>
          <figcaption class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary-dark" aria-hidden="true">${t.name.charAt(0)}</span>
            <div>
              <p class="text-sm font-semibold text-foreground">${t.name}</p>
              <p class="text-xs text-muted">${t.role}</p>
            </div>
          </figcaption>
        </figure>`
      ).join('')}
    </div>
  </section>
`;

const FaqSection = () => `
  <section class="bg-surface" aria-labelledby="faq-title">
    <div class="mx-auto max-w-3xl px-4 py-16">
      <h2 id="faq-title" class="text-balance text-center text-3xl font-bold text-foreground">Preguntas frecuentes</h2>
      <div class="mt-8 flex flex-col gap-3">
        ${FAQ_PREVIEW.map(
          (item) => `
          <details class="group rounded-2xl bg-background p-5 ring-1 ring-black/5">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground">
              ${item.q}
              <span class="text-primary-dark transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-muted">${item.a}</p>
          </details>`
        ).join('')}
      </div>
      <div class="mt-8 text-center">
        ${Button({ label: 'Ver todas las preguntas', href: ROUTES.FAQ, variant: 'outline' })}
      </div>
    </div>
  </section>
`;

const CtaSection = () => `
  <section class="mx-auto max-w-6xl px-4 py-16">
    <div class="rounded-3xl bg-primary px-6 py-12 text-center shadow-sm md:px-12">
      <h2 class="text-balance text-3xl font-bold text-white">Empieza a cuidar tu salud hoy</h2>
      <p class="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-white/90">
        Únete a Palm Health y mantén una conexión real con tu profesional de la salud, estés donde estés.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        ${Button({ label: 'Crear cuenta gratis', href: ROUTES.REGISTER_PATIENT, variant: 'outline', size: 'lg', extra: 'border-white text-white hover:bg-white hover:text-primary-dark' })}
        ${Button({ label: 'Contactar al equipo', href: ROUTES.CONTACT, variant: 'ghost', size: 'lg', extra: 'text-white hover:bg-white/15' })}
      </div>
    </div>
  </section>
`;

/* ------------------------------ view ------------------------------ */

/**
 * @returns {string}
 */
export const render = () =>
  PublicLayout(`
    ${HeroSection()}
    ${AboutSection()}
    ${FeaturesSection()}
    ${BenefitsSection()}
    ${HowItWorksSection()}
    ${TestimonialsSection()}
    ${FaqSection()}
    ${CtaSection()}
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Palm Health — Tu salud, siempre al alcance de tu mano';
};
