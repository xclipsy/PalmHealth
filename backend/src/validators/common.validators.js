/**
 * Cadenas de validación compartidas por los módulos de pacientes y
 * profesionales:
 * parámetros de ID, consultas de paginación/ordenamiento, filtros de
 * fecha, notificaciones y configuraciones.
 *
 * Todos los mensajes son visibles para el usuario y están en español.
 */

const { param, query, body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

/** Positive integer :id route param. */
const idParamChain = (paramName = 'id') =>
  param(paramName)
    .isInt({ min: 1 })
    .withMessage('El identificador no es válido.');

/** Pagination query chains (page/limit). */
const paginationChains = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100.'),
];

/** Sorting query chains (sort column is whitelisted in repositories). */
const sortingChains = () => [
  query('sort').optional().isLength({ max: 30 }).withMessage('El campo de ordenamiento no es válido.'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('El orden debe ser "asc" o "desc".'),
];

/** ISO date range filters (from/to). */
const dateRangeChains = () => [
  query('from').optional().isISO8601().withMessage('La fecha inicial no es válida.'),
  query('to').optional().isISO8601().withMessage('La fecha final no es válida.'),
];

/** Generic :id validator (param only). */
const idParamValidator = [idParamChain(), handleValidationErrors];

/** Generic pagination-only validator for simple list endpoints. */
const paginationValidator = [...paginationChains(), handleValidationErrors];

/** GET /notifications — read filter + pagination. */
const listNotificationsValidator = [
  query('read')
    .optional()
    .isBoolean()
    .withMessage('El filtro de leídas debe ser true o false.'),
  ...paginationChains(),
  handleValidationErrors,
];

/** GET /calendar — required month window. */
const calendarValidator = [
  query('year')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('El año no es válido.'),
  query('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes debe estar entre 1 y 12.'),
  handleValidationErrors,
];

/** PUT /settings */
const updateSettingsValidator = [
  body('language')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('El idioma no es válido.'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('La zona horaria no es válida.'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('El tema debe ser "light" o "dark".'),
  body('notificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('El valor de notificaciones debe ser true o false.'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('El valor de notificaciones por correo debe ser true o false.'),
  handleValidationErrors,
];

module.exports = {
  idParamChain,
  paginationChains,
  sortingChains,
  dateRangeChains,
  idParamValidator,
  paginationValidator,
  listNotificationsValidator,
  calendarValidator,
  updateSettingsValidator,
};
