/**
 * Professional notifications — list, unread indicator, mark as read,
 * delete and type filter (mirror of the patient view, Part 5).
 *
 * API:
 *   GET    /api/professional/notifications (pagination, unreadOnly)
 *   PATCH  /api/professional/notifications/:id/read
 *   DELETE /api/professional/notifications/:id
 */

import { ROUTES, NOTIFICATION_TYPE_LABELS } from '../../constants/app.constants.js';
import { escapeHtml } from '../../utils/dom.util.js';
import { formatDateTime } from '../../utils/format.util.js';
import { Card, Pagination } from '../../components/ui.components.js';
import { Skeleton, EmptyState, ErrorState, showToast } from '../../components/feedback.components.js';
import { ProfessionalLayout, mountProfessionalLayout } from '../../layouts/professional.layout.js';
import { FilterSelect } from '../../utils/list-view.util.js';
import {
  listNotifications,
  markNotificationRead,
  deleteNotification,
} from '../../services/professional.service.js';

const BREADCRUMBS = [{ label: 'Panel', href: ROUTES.PROFESSIONAL_DASHBOARD }, { label: 'Notificaciones' }];
const PAGE_SIZE = 10;

/** One notification row. */
const NotificationItem = (notification) => `
  <li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="flex items-center gap-2">
        ${notification.is_read ? '' : '<span class="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="No leída"></span>'}
        <span class="text-sm font-semibold text-foreground">${escapeHtml(notification.title)}</span>
        <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-dark">${escapeHtml(NOTIFICATION_TYPE_LABELS[notification.type] || notification.type)}</span>
      </div>
      <span class="text-xs text-muted">${formatDateTime(notification.created_at)}</span>
    </div>
    <p class="text-sm leading-relaxed text-foreground">${escapeHtml(notification.message || '')}</p>
    <div class="flex gap-2">
      ${
        notification.is_read
          ? ''
          : `<button type="button" data-read="${notification.id}"
              class="rounded-full px-3 py-1.5 text-xs font-semibold text-primary-dark hover:bg-primary/10">Marcar como leída</button>`
      }
      <button type="button" data-remove="${notification.id}"
        class="rounded-full px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/10">Eliminar</button>
    </div>
  </li>
`;

export const render = () =>
  ProfessionalLayout({
    active: 'notifications',
    breadcrumbs: BREADCRUMBS,
    content: `
      <div class="flex flex-col gap-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground text-balance">Notificaciones</h1>
          <p class="mt-1 text-sm leading-relaxed text-muted">Avisos sobre tus pacientes: nuevos síntomas, citas y vinculaciones.</p>
        </div>

        <div class="grid gap-3 sm:max-w-md sm:grid-cols-2" role="group" aria-label="Filtros de notificaciones">
          ${FilterSelect({
            id: 'filter-unread',
            label: 'Estado',
            options: [{ value: 'true', label: 'Solo no leídas' }],
          })}
          ${FilterSelect({
            id: 'filter-type',
            label: 'Tipo',
            options: Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          })}
        </div>

        <div id="notifications-list" aria-live="polite">${Card({ content: Skeleton({ lines: 6 }) })}</div>
        <div id="notifications-pagination"></div>
      </div>
    `,
  });

export const mount = () => {
  mountProfessionalLayout();
  const listNode = document.getElementById('notifications-list');
  const paginationNode = document.getElementById('notifications-pagination');
  const state = { page: 1, unreadOnly: '', type: '' };

  const load = async () => {
    listNode.innerHTML = Card({ content: Skeleton({ lines: 6 }) });
    paginationNode.innerHTML = '';
    try {
      const { data, pagination } = await listNotifications({
        page: state.page,
        limit: PAGE_SIZE,
        unreadOnly: state.unreadOnly,
      });

      /* Local type filter over the current page (API filters unread only). */
      const rows = state.type ? data.filter((n) => n.type === state.type) : data;

      if (!rows.length) {
        listNode.innerHTML = EmptyState({
          title: 'Sin notificaciones',
          description: state.unreadOnly || state.type
            ? 'No hay notificaciones que coincidan con los filtros.'
            : 'Cuando tus pacientes registren novedades, las verás aquí.',
        });
        return;
      }

      listNode.innerHTML = Card({
        content: `<ul class="flex flex-col divide-y divide-black/5">${rows.map(NotificationItem).join('')}</ul>`,
      });
      paginationNode.innerHTML = Pagination({ page: pagination.page, totalPages: pagination.totalPages });

      paginationNode.querySelectorAll('[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
          state.page = Number(button.dataset.page);
          load();
        });
      });
      listNode.querySelectorAll('[data-read]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await markNotificationRead(button.dataset.read);
            showToast('Notificación marcada como leída.', 'success');
            load();
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      });
      listNode.querySelectorAll('[data-remove]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await deleteNotification(button.dataset.remove);
            showToast('Notificación eliminada.', 'success');
            load();
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      });
    } catch (error) {
      listNode.innerHTML = ErrorState({ message: error.message, retryId: 'notifications-retry' });
      document.getElementById('notifications-retry')?.addEventListener('click', load);
    }
  };

  document.getElementById('filter-unread').addEventListener('change', (event) => {
    state.unreadOnly = event.target.value;
    state.page = 1;
    load();
  });
  document.getElementById('filter-type').addEventListener('change', (event) => {
    state.type = event.target.value;
    load();
  });

  load();
};
