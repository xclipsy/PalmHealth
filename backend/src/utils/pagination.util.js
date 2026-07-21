/**
 * Utilidades de paginación (Parte 8 de la especificación).
 *
 * Todos los endpoints de listado aceptan los parámetros de consulta
 * `page` y `limit` y devuelven un objeto `pagination` estandarizado.
 *
 * Estas funciones auxiliares mantienen el análisis de parámetros y la
 * construcción de metadatos en un solo lugar, evitando duplicar lógica
 * en servicios y controladores.
 */

const { PAGINATION } = require('../constants/app.constants');

/**
 * Analiza y ajusta los parámetros de consulta de paginación.
 *
 * @param {object} queryParams - req.query de Express.
 * @param {string|number} [queryParams.page] - Página solicitada (basada en 1).
 * @param {string|number} [queryParams.limit] - Cantidad de elementos por página.
 * @returns {{ page: number, limit: number, offset: number }} Valores seguros
 * para SQL LIMIT/OFFSET.
 */
const parsePagination = (queryParams = {}) => {
  const rawPage = Number(queryParams.page);
  const rawLimit = Number(queryParams.limit);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : PAGINATION.DEFAULT_PAGE;
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, PAGINATION.MAX_LIMIT)
      : PAGINATION.DEFAULT_LIMIT;

  return { page, limit, offset: (page - 1) * limit };
};

/**
 * Construye los metadatos de paginación estandarizados para respuestas
 * de listados.
 *
 * @param {number} totalItems - Cantidad total de registros (antes de LIMIT/OFFSET).
 * @param {number} page - Página actual (basada en 1).
 * @param {number} limit - Tamaño de página.
 * @returns {{ page: number, limit: number, totalItems: number, totalPages: number }}
 */
const buildPaginationMeta = (totalItems, page, limit) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

module.exports = { parsePagination, buildPaginationMeta };
