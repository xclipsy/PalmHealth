/**
 * Pagination utilities (Part 8 of the specification).
 *
 * Every list endpoint accepts `page` and `limit` query parameters and
 * returns a standardized `pagination` object. These helpers keep the
 * parsing and metadata construction in one place so services and
 * controllers never duplicate the logic.
 */

const { PAGINATION } = require('../constants/app.constants');

/**
 * Parses and clamps pagination query parameters.
 *
 * @param {object} queryParams - Express req.query.
 * @param {string|number} [queryParams.page] - Requested page (1-based).
 * @param {string|number} [queryParams.limit] - Requested page size.
 * @returns {{ page: number, limit: number, offset: number }} Safe values for SQL LIMIT/OFFSET.
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
 * Builds the standardized pagination metadata for list responses.
 *
 * @param {number} totalItems - Total row count (before LIMIT/OFFSET).
 * @param {number} page - Current page (1-based).
 * @param {number} limit - Page size.
 * @returns {{ page: number, limit: number, totalItems: number, totalPages: number }}
 */
const buildPaginationMeta = (totalItems, page, limit) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

module.exports = { parsePagination, buildPaginationMeta };
