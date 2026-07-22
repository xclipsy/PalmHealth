/**
 * Authentication layout: centered card with brand header.
 * Used by login, register, forgot/reset password and verification.
 */

import { ROUTES } from '../constants/app.constants.js';

/**
 * Wraps an auth form in the centered shell.
 * @param {{ title: string, subtitle?: string, content: string, maxWidth?: string }} props
 * @returns {string}
 */
export const AuthLayout = ({ title, subtitle = '', content, maxWidth = 'max-w-md' }) => `
  <main id="main-content" class="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
    <a href="${ROUTES.HOME}" data-link class="mb-6 flex flex-col items-center gap-2" aria-label="Volver al inicio de Palm Health">
      <img src="/src/assets/images/logo.png" alt="" class="h-16 w-auto" />
      <span class="text-xl font-bold text-primary-dark">Palm Health</span>
    </a>

    <div class="w-full ${maxWidth} rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <h1 class="text-balance text-center text-2xl font-bold text-foreground">${title}</h1>
      ${subtitle ? `<p class="mt-2 text-pretty text-center text-sm leading-relaxed text-muted">${subtitle}</p>` : ''}
      <div class="mt-6">${content}</div>
    </div>
  </main>
`;
