/**
 * Feedback components: Spinner, Skeleton, EmptyState, ErrorState,
 * Toast notifications, Modal and ConfirmDialog.
 *
 * Toast/Modal/Confirm are imperative helpers that mount into
 * dedicated portal nodes so any view can trigger them.
 */

import { escapeHtml } from '../utils/dom.util.js';
import { Button } from './ui.components.js';

/**
 * Loading spinner.
 * @param {{ label?: string, size?: 'sm'|'md'|'lg' }} props
 * @returns {string}
 */
export const Spinner = ({ label = 'Cargando…', size = 'md' } = {}) => {
  const sizes = { sm: 'h-5 w-5 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' };
  return `
    <div class="flex flex-col items-center justify-center gap-3 py-8" role="status">
      <span class="${sizes[size]} animate-spin rounded-full border-primary border-t-transparent" aria-hidden="true"></span>
      <span class="text-sm text-muted">${escapeHtml(label)}</span>
    </div>
  `;
};

/**
 * Skeleton loader block (no layout shift: caller sets dimensions).
 * @param {{ lines?: number }} props
 * @returns {string}
 */
export const Skeleton = ({ lines = 3 } = {}) => `
  <div class="flex animate-pulse flex-col gap-3" aria-hidden="true">
    ${Array.from({ length: lines })
      .map((_, i) => `<div class="h-4 rounded-full bg-black/10 ${i === lines - 1 ? 'w-2/3' : 'w-full'}"></div>`)
      .join('')}
  </div>
`;

/**
 * Empty state with optional action.
 * @param {{ title: string, description?: string, actionHtml?: string }} props
 * @returns {string}
 */
export const EmptyState = ({ title, description = '', actionHtml = '' }) => `
  <div class="flex flex-col items-center justify-center gap-3 rounded-3xl bg-surface px-6 py-12 text-center ring-1 ring-black/5">
    <span class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-2xl text-primary-dark" aria-hidden="true">○</span>
    <h3 class="text-lg font-semibold text-foreground">${escapeHtml(title)}</h3>
    ${description ? `<p class="max-w-sm text-sm leading-relaxed text-muted">${escapeHtml(description)}</p>` : ''}
    ${actionHtml}
  </div>
`;

/**
 * Friendly error state with retry slot.
 * @param {{ message?: string, retryId?: string }} props
 * @returns {string}
 */
export const ErrorState = ({ message = 'Ocurrió un error inesperado.', retryId = '' } = {}) => `
  <div class="flex flex-col items-center justify-center gap-3 rounded-3xl bg-error/10 px-6 py-12 text-center ring-1 ring-error/30">
    <h3 class="text-lg font-semibold text-foreground">Algo salió mal</h3>
    <p class="max-w-sm text-sm leading-relaxed text-muted">${escapeHtml(message)}</p>
    ${retryId ? Button({ label: 'Reintentar', id: retryId, variant: 'outline', size: 'sm' }) : ''}
  </div>
`;

/* ------------------------------------------------------------------ */
/* Toast notifications (imperative)                                    */
/* ------------------------------------------------------------------ */

const TOAST_DURATION_MS = 4000;

const getToastPortal = () => {
  let portal = document.getElementById('toast-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'toast-portal';
    portal.setAttribute('aria-live', 'polite');
    portal.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(portal);
  }
  return portal;
};

/**
 * Shows a transient toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [variant]
 */
export const showToast = (message, variant = 'info') => {
  const colors = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-foreground text-white',
  };
  const toast = document.createElement('div');
  toast.className = `${colors[variant]} max-w-xs rounded-2xl px-4 py-3 text-sm font-medium shadow-lg`;
  toast.textContent = message;
  getToastPortal().appendChild(toast);
  setTimeout(() => toast.remove(), TOAST_DURATION_MS);
};

/* ------------------------------------------------------------------ */
/* Modal + ConfirmDialog (imperative)                                  */
/* ------------------------------------------------------------------ */

/**
 * Opens an accessible modal with the provided HTML content.
 * Returns a close function. Escape key and backdrop click close it.
 * @param {{ title: string, content: string, onClose?: () => void }} props
 * @returns {() => void} close
 */
export const openModal = ({ title, content, onClose }) => {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);

  overlay.innerHTML = `
    <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 shadow-xl" data-modal-panel>
      <div class="mb-4 flex items-start justify-between gap-4">
        <h2 class="text-lg font-semibold text-foreground">${escapeHtml(title)}</h2>
        <button type="button" data-modal-close aria-label="Cerrar ventana"
          class="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-foreground">✕</button>
      </div>
      <div>${content}</div>
    </div>
  `;

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKeydown);
    if (onClose) onClose();
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') close();
  };

  overlay.addEventListener('click', (event) => {
    if (!event.target.closest('[data-modal-panel]') || event.target.closest('[data-modal-close]')) close();
  });
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(overlay);
  overlay.querySelector('[data-modal-close]').focus();

  return close;
};

/**
 * Opens a confirmation dialog; resolves true when confirmed.
 * @param {{ title: string, message: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} props
 * @returns {Promise<boolean>}
 */
export const confirmDialog = ({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false }) =>
  new Promise((resolve) => {
    const close = openModal({
      title,
      content: `
        <p class="mb-6 text-sm leading-relaxed text-muted">${escapeHtml(message)}</p>
        <div class="flex justify-end gap-3">
          ${Button({ label: cancelLabel, variant: 'ghost', id: 'confirm-cancel' })}
          ${Button({ label: confirmLabel, variant: danger ? 'danger' : 'primary', id: 'confirm-accept' })}
        </div>
      `,
      onClose: () => resolve(false),
    });

    document.getElementById('confirm-cancel').addEventListener('click', () => close());
    document.getElementById('confirm-accept').addEventListener('click', () => {
      resolve(true);
      // Detach onClose resolution by removing overlay directly.
      close();
    });
  });
