/**
 * Formatting helpers: dates, times and status badges in Spanish.
 * All views format API values through this module — never inline.
 */

import { STATUS_LABELS } from '../constants/app.constants.js';
import { escapeHtml } from './dom.util.js';

const DATE_LOCALE = 'es-MX';

/**
 * Formats an ISO date(-time) string as a long Spanish date.
 * @param {string} iso
 * @returns {string} e.g. "1 de agosto de 2026"
 */
export const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Formats an ISO datetime as date + time.
 * @param {string} iso
 * @returns {string} e.g. "1 de agosto de 2026, 10:00"
 */
export const formatDateTime = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDate(iso)}, ${date.toLocaleTimeString(DATE_LOCALE, { hour: '2-digit', minute: '2-digit' })}`;
};

/**
 * Short relative label for recent items (hoy, ayer, date).
 * @param {string} iso
 * @returns {string}
 */
export const formatRelative = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return formatDate(iso);
};

/**
 * Status badge with semantic colors.
 * @param {string} status - Backend status value.
 * @returns {string} HTML badge.
 */
export const StatusBadge = (status) => {
  const label = STATUS_LABELS[status] || status || '—';
  const colors = {
    SCHEDULED: 'bg-accent/15 text-accent-dark ring-accent/30',
    ACTIVE: 'bg-success/15 text-foreground ring-success/40',
    COMPLETED: 'bg-primary/15 text-primary-dark ring-primary/30',
    CANCELLED: 'bg-error/10 text-error ring-error/30',
    SUSPENDED: 'bg-warning/20 text-foreground ring-warning/50',
  };
  const color = colors[status] || 'bg-black/5 text-muted ring-black/10';
  return `<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${color}">${escapeHtml(label)}</span>`;
};

/**
 * Intensity meter (1-10) rendered as an accessible progress bar.
 * @param {number} intensity
 * @returns {string}
 */
export const IntensityMeter = (intensity) => {
  const value = Math.max(1, Math.min(10, Number(intensity) || 1));
  const color = value >= 8 ? 'bg-error' : value >= 5 ? 'bg-warning' : 'bg-success';
  return `
    <div class="flex items-center gap-2" role="img" aria-label="Intensidad ${value} de 10">
      <div class="h-2 w-24 overflow-hidden rounded-full bg-black/10">
        <div class="${color} h-full rounded-full" style="width: ${value * 10}%"></div>
      </div>
      <span class="text-xs font-semibold text-foreground">${value}/10</span>
    </div>
  `;
};
