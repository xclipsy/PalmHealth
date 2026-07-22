/**
 * Shared paginated-list controller for patient views.
 *
 * Handles the repeated skeleton → fetch → empty/error/list → pagination
 * cycle so each view only supplies the fetcher and the item renderer.
 */

import { Card, Pagination } from '../components/ui.components.js';
import { Skeleton, EmptyState, ErrorState } from '../components/feedback.components.js';

/**
 * Creates a list controller bound to two DOM nodes.
 * @param {{
 *   listNode: HTMLElement,
 *   paginationNode: HTMLElement,
 *   fetcher: (query: Object) => Promise<{ data: Array, pagination: Object }>,
 *   renderItem: (item: Object) => string,
 *   empty: { title: string, description?: string },
 *   pageSize?: number,
 *   onRendered?: (rows: Array) => void,
 * }} config
 * @returns {{ load: () => Promise<void>, state: { page: number, filters: Object } }}
 */
export const createListController = ({
  listNode,
  paginationNode,
  fetcher,
  renderItem,
  empty,
  pageSize = 10,
  onRendered,
}) => {
  const state = { page: 1, filters: {} };

  const load = async () => {
    listNode.innerHTML = Card({ content: Skeleton({ lines: 6 }) });
    paginationNode.innerHTML = '';
    try {
      const { data, pagination } = await fetcher({ page: state.page, limit: pageSize, ...state.filters });

      if (!data.length) {
        const hasFilters = Object.values(state.filters).some((value) => value);
        listNode.innerHTML = EmptyState({
          title: empty.title,
          description: hasFilters
            ? 'No hay resultados que coincidan con los filtros seleccionados.'
            : empty.description,
        });
        return;
      }

      listNode.innerHTML = Card({
        content: `<ul class="flex flex-col divide-y divide-black/5">${data.map(renderItem).join('')}</ul>`,
      });
      if (pagination) {
        paginationNode.innerHTML = Pagination({ page: pagination.page, totalPages: pagination.totalPages });
        paginationNode.querySelectorAll('[data-page]').forEach((button) => {
          button.addEventListener('click', () => {
            state.page = Number(button.dataset.page);
            load();
          });
        });
      }
      if (onRendered) onRendered(data);
    } catch (error) {
      listNode.innerHTML = ErrorState({ message: error.message, retryId: 'list-retry' });
      listNode.querySelector('#list-retry')?.addEventListener('click', load);
    }
  };

  return { load, state };
};

/**
 * Standard filter <select> markup (status/category filters).
 * @param {{ id: string, label: string, options: Array<{value: string, label: string}> }} props
 * @returns {string}
 */
export const FilterSelect = ({ id, label, options }) => `
  <div class="flex flex-col gap-1.5">
    <label for="${id}" class="text-sm font-medium text-foreground">${label}</label>
    <select id="${id}"
      class="w-full rounded-2xl border border-black/10 bg-surface px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
      <option value="">Todos</option>
      ${options.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
    </select>
  </div>
`;
