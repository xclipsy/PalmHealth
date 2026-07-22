/**
 * 404 Not Found page — router fallback for unmatched routes.
 */

import { ROUTES } from '../../constants/app.constants.js';
import { PublicLayout, mountPublicLayout } from '../../layouts/public.layout.js';
import { Button } from '../../components/ui.components.js';

export const render = () =>
  PublicLayout(`
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p class="text-7xl font-bold text-primary/40" aria-hidden="true">404</p>
      <h1 class="text-balance text-3xl font-bold text-foreground">Página no encontrada</h1>
      <p class="max-w-md text-pretty leading-relaxed text-muted">
        La página que buscas no existe o fue movida. Verifica la dirección o vuelve al inicio.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        ${Button({ label: 'Volver al inicio', href: ROUTES.HOME })}
        ${Button({ label: 'Contactar soporte', href: ROUTES.CONTACT, variant: 'outline' })}
      </div>
    </div>
  `);

export const mount = () => {
  mountPublicLayout();
  document.title = 'Página no encontrada — Palm Health';
};
