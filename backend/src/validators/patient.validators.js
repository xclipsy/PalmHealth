/**
 * Patient module validators — every /api/patient/* write and every
 * filtered list runs one of these chains before its controller.
 */

const { body, query } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');
const {
  idParamChain,
  paginationChains,
  sortingChains,
  dateRangeChains,
} = require('./common.validators');
const {
  APPOINTMENT_STATUS,
  TREATMENT_STATUS,
  SYMPTOM_INTENSITY,
} = require('../constants/app.constants');

/** PUT /api/patient/profile — patient-editable fields only. */
const updateProfileValidator = [
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono debe tener entre 7 y 30 caracteres.'),
  body('gender')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 20 })
    .withMessage('El género no puede superar los 20 caracteres.'),
  body('emergencyContactName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('El nombre del contacto de emergencia es demasiado largo.'),
  body('emergencyContactPhone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 30 })
    .withMessage('El teléfono del contacto de emergencia es demasiado largo.'),
  handleValidationErrors,
];

/** GET /api/patient/appointments */
const listAppointmentsValidator = [
  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('El estado de la cita no es válido.'),
  ...dateRangeChains(),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

/** PATCH /api/patient/appointments/:id/cancel */
const cancelAppointmentValidator = [
  idParamChain(),
  body('reason')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('El motivo no puede superar los 255 caracteres.'),
  handleValidationErrors,
];

/** GET /api/patient/symptoms */
const listSymptomsValidator = [
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La categoría no es válida.'),
  query('minIntensity')
    .optional()
    .isInt({ min: SYMPTOM_INTENSITY.MIN, max: SYMPTOM_INTENSITY.MAX })
    .withMessage('La intensidad mínima debe estar entre 1 y 10.'),
  ...dateRangeChains(),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

/**
 * Marks a chain as required (with a Spanish message) on create, or
 * optional on update. Keeps subsequent validators intact.
 * @param {import('express-validator').ValidationChain} chain
 * @param {boolean} isCreate
 * @param {string} requiredMessage
 */
const requiredOnCreate = (chain, isCreate, requiredMessage) =>
  isCreate
    ? chain.notEmpty().withMessage(requiredMessage)
    : chain.optional();

/** Shared field chains for symptom writes. */
const symptomFieldChains = (isCreate) => [
  requiredOnCreate(body('categoryId'), isCreate, 'La categoría es obligatoria.')
    .isInt({ min: 1 })
    .withMessage('La categoría no es válida.'),
  requiredOnCreate(body('intensity'), isCreate, 'La intensidad es obligatoria.')
    .isInt({ min: SYMPTOM_INTENSITY.MIN, max: SYMPTOM_INTENSITY.MAX })
    .withMessage('La intensidad debe estar entre 1 y 10.'),
  requiredOnCreate(body('description'), isCreate, 'La descripción es obligatoria.')
    .trim()
    .isLength({ min: 3, max: 2000 })
    .withMessage('La descripción debe tener entre 3 y 2000 caracteres.'),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden superar los 2000 caracteres.'),
  body('bodyZone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La zona del cuerpo no puede superar los 100 caracteres.'),
  body('occurredAt')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha del síntoma no es válida.')
    .custom((value) => new Date(value) <= new Date())
    .withMessage('La fecha del síntoma no puede ser futura.'),
];

/** POST /api/patient/symptoms */
const createSymptomValidator = [...symptomFieldChains(true), handleValidationErrors];

/** PUT /api/patient/symptoms/:id */
const updateSymptomValidator = [
  idParamChain(),
  ...symptomFieldChains(false),
  handleValidationErrors,
];

/** GET lists filtered by treatment-style status (treatments, medications, routines). */
const statusFilterValidator = [
  query('status')
    .optional()
    .isIn(Object.values(TREATMENT_STATUS))
    .withMessage('El estado no es válido.'),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

module.exports = {
  updateProfileValidator,
  listAppointmentsValidator,
  cancelAppointmentValidator,
  listSymptomsValidator,
  createSymptomValidator,
  updateSymptomValidator,
  statusFilterValidator,
};
