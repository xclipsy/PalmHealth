// Componentes UI Primitivos (Botón, Card, Input, Textarea, Select, Alerta, Badge, Avatar, Breadcrumbs, Paginación).
import { escapeHtml } from '../utils/dom.util.js';

// Botón reutilizable
export const Button = ({ label, type = 'button', variant = 'primary', size = 'md', id = '', href = '', extra = '', attrs = '', disabled = false }) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-accent text-white hover:opacity-90',
    outline: 'border-2 border-primary text-primary-dark hover:bg-primary hover:text-white',
    ghost: 'text-primary-dark hover:bg-primary/10',
    danger: 'bg-error text-white hover:opacity-90',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;

  if (href) {
    return `<a href="${escapeHtml(href)}" data-link ${id ? `id="${id}"` : ''} ${attrs} class="${classes}">${label}</a>`;
  }
  return `<button type="${type}" ${id ? `id="${id}"` : ''} ${attrs} ${disabled ? 'disabled' : ''} class="${classes}">${label}</button>`;
};

// Contenedor Card
export const Card = ({ content, extra = '' }) => `
  <div class="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-black/5 ${extra}">${content}</div>
`;

// Input de texto/correo/contraseña
export const Input = ({ name, label, type = 'text', placeholder = '', required = false, value = '', autocomplete = '', hint = '' }) => `
  <div class="flex flex-col gap-1.5">
    <label for="${name}" class="text-sm font-medium text-foreground">${escapeHtml(label)}${required ? ' <span class="text-error" aria-hidden="true">*</span>' : ''}</label>
    <input
      id="${name}" name="${name}" type="${type}"
      placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}"
      ${required ? 'required aria-required="true"' : ''}
      ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
      aria-describedby="${name}-error"
      class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
    ${hint ? `<p class="text-xs text-muted">${escapeHtml(hint)}</p>` : ''}
    <p id="${name}-error" class="hidden text-xs font-medium text-error" role="alert"></p>
  </div>
`;

// Área de texto
export const Textarea = ({ name, label, placeholder = '', required = false, rows = 4, value = '' }) => `
  <div class="flex flex-col gap-1.5">
    <label for="${name}" class="text-sm font-medium text-foreground">${escapeHtml(label)}${required ? ' <span class="text-error" aria-hidden="true">*</span>' : ''}</label>
    <textarea
      id="${name}" name="${name}" rows="${rows}" placeholder="${escapeHtml(placeholder)}"
      ${required ? 'required aria-required="true"' : ''} aria-describedby="${name}-error"
      class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
    >${escapeHtml(value)}</textarea>
    <p id="${name}-error" class="hidden text-xs font-medium text-error" role="alert"></p>
  </div>
`;

// Selección desplegable
export const Select = ({ name, label, options, required = false, placeholder = 'Selecciona una opción' }) => `
  <div class="flex flex-col gap-1.5">
    <label for="${name}" class="text-sm font-medium text-foreground">${escapeHtml(label)}${required ? ' <span class="text-error" aria-hidden="true">*</span>' : ''}</label>
    <select
      id="${name}" name="${name}" ${required ? 'required aria-required="true"' : ''} aria-describedby="${name}-error"
      class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <option value="">${escapeHtml(placeholder)}</option>
      ${options.map((opt) => `<option value="${escapeHtml(opt.value)}"${opt.selected ? ' selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
    </select>
    <p id="${name}-error" class="hidden text-xs font-medium text-error" role="alert"></p>
  </div>
`;

// Banner de alerta informativa o de error
export const Alert = ({ message, variant = 'info', id = '' }) => {
  const variants = {
    success: 'bg-success/15 text-foreground ring-success/40',
    error: 'bg-error/15 text-foreground ring-error/40',
    warning: 'bg-warning/20 text-foreground ring-warning/50',
    info: 'bg-accent/15 text-foreground ring-accent/40',
  };
  return `
    <div ${id ? `id="${id}"` : ''} role="alert" class="rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${variants[variant]}">
      ${escapeHtml(message)}
    </div>
  `;
};

// Indicador de punto rojo para notificaciones no leídas
export const NotificationBadge = ({ count }) =>
  count > 0
    ? `<span style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; background-color: #ef4444; border-radius: 9999px; border: 2px solid white; z-index: 30; pointer-events: none;" aria-label="${count} notificaciones sin leer"></span>`
    : '';

// Avatar de usuario con iniciales
export const Avatar = ({ name, size = 'md' }) => {
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl' };
  return `<span class="inline-flex ${sizes[size]} items-center justify-center rounded-full bg-primary/20 font-semibold text-primary-dark" aria-hidden="true">${escapeHtml(initials)}</span>`;
};

// Migas de pan (Breadcrumbs)
export const Breadcrumbs = ({ items }) => `
  <nav aria-label="Ruta de navegación" class="text-sm text-muted">
    <ol class="flex flex-wrap items-center gap-1.5">
      ${items
        .map((item, index) => {
          const isLast = index === items.length - 1;
          const node = item.href && !isLast
            ? `<a href="${escapeHtml(item.href)}" data-link class="hover:text-primary-dark">${escapeHtml(item.label)}</a>`
            : `<span ${isLast ? 'aria-current="page" class="font-medium text-foreground"' : ''}>${escapeHtml(item.label)}</span>`;
          return `<li class="flex items-center gap-1.5">${node}${isLast ? '' : '<span aria-hidden="true">/</span>'}</li>`;
        })
        .join('')}
    </ol>
  </nav>
`;

// Control de paginación
export const Pagination = ({ page, totalPages }) => {
  if (totalPages <= 1) return '';
  return `
    <nav aria-label="Paginación" class="flex items-center justify-center gap-2">
      <button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}
        class="rounded-full px-4 py-2 text-sm font-medium text-primary-dark hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">
        Anterior
      </button>
      <span class="text-sm text-muted">Página ${page} de ${totalPages}</span>
      <button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}
        class="rounded-full px-4 py-2 text-sm font-medium text-primary-dark hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">
        Siguiente
      </button>
    </nav>
  `;
};
