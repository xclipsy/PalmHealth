/**
 * Validadores del módulo de profesionales: cada operación de escritura
 * en /api/professional/* y cada listado con filtros ejecuta una de estas
 * cadenas antes de llegar al controlador.
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
  ASSIGNMENT_STATUS,
  ROUTINE_TYPES,
} = require('../constants/app.constants');

/** PUT /api/professional/profile — license number is never editable. */
const updateProfileValidator = [
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono debe tener entre 7 y 30 caracteres.'),
  body('specialty')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('La especialidad debe tener entre 3 y 100 caracteres.'),
  body('yearsExperience')
    .optional({ values: 'null' })
    .isInt({ min: 0, max: 70 })
    .withMessage('Los años de experiencia deben estar entre 0 y 70.'),
  body('clinicName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('El nombre de la clínica es demasiado largo.'),
  handleValidationErrors,
];

/** GET /api/professional/patients — search + assignment status filter. */
const listPatientsValidator = [
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La búsqueda no puede superar los 100 caracteres.'),
  query('status')
    .optional()
    .isIn(Object.values(ASSIGNMENT_STATUS))
    .withMessage('El estado de vinculación no es válido.'),
  ...paginationChains(),
  handleValidationErrors,
];

/** POST /api/professional/patients/link — link by registered email. */
const linkPatientValidator = [
  body('email')
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio.')
    .isEmail()
    .withMessage('El correo electrónico no es válido.')
    .normalizeEmail(),
  handleValidationErrors,
];

/** PATCH /api/professional/patients/:id/assignment */
const updateAssignmentValidator = [
  idParamChain(),
  body('status')
    .notEmpty()
    .withMessage('El estado es obligatorio.')
    .isIn(Object.values(ASSIGNMENT_STATUS))
    .withMessage('El estado de vinculación no es válido.'),
  handleValidationErrors,
];

/** GET /api/professional/appointments */
const listAppointmentsValidator = [
  query('status')
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('El estado de la cita no es válido.'),
  query('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El paciente no es válido.'),
  ...dateRangeChains(),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

/**
 * Cadena de validación para patientId en el cuerpo: obligatorio al crear
 * e inmutable al actualizar.
 *
 * Los validadores de actualización simplemente lo omiten (el paciente
 * propietario nunca cambia).
 */
const patientIdBodyChain = () =>
  body('patientId')
    .notEmpty()
    .withMessage('El paciente es obligatorio.')
    .isInt({ min: 1 })
    .withMessage('El paciente no es válido.');

/**
 * Marca una cadena como obligatoria (con un mensaje en español) al crear,
 * u opcional al actualizar. Mantiene intactos los validadores posteriores.
 *
 * @param {import('express-validator').ValidationChain} chain
 * @param {boolean} isCreate
 * @param {string} requiredMessage
 */
const requiredOnCreate = (chain, isCreate, requiredMessage) =>
  isCreate
    ? chain.notEmpty().withMessage(requiredMessage)
    : chain.optional();

/** Shared appointment field chains (without patientId). */
const appointmentFieldChains = (isCreate) => [
  requiredOnCreate(body('scheduledAt'), isCreate, 'La fecha de la cita es obligatoria.')
    .isISO8601()
    .withMessage('La fecha de la cita no es válida.')
    .custom((value) => new Date(value) > new Date())
    .withMessage('La fecha de la cita debe ser futura.'),
  requiredOnCreate(body('reason'), isCreate, 'El motivo de la cita es obligatorio.')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('El motivo debe tener entre 3 y 255 caracteres.'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 5, max: 480 })
    .withMessage('La duración debe estar entre 5 y 480 minutos.'),
  body('location')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('La ubicación es demasiado larga.'),
  body('notes')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden superar los 2000 caracteres.'),
];

/** POST /api/professional/appointments */
const createAppointmentValidator = [
  patientIdBodyChain(),
  ...appointmentFieldChains(true),
  handleValidationErrors,
];

/** PUT /api/professional/appointments/:id — patientId never changes. */
const updateAppointmentValidator = [
  idParamChain(),
  ...appointmentFieldChains(false),
  body('status')
    .optional()
    .isIn([APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.COMPLETED])
    .withMessage('El estado de la cita no es válido.'),
  handleValidationErrors,
];

/** PATCH /api/professional/appointments/:id/cancel */
const cancelAppointmentValidator = [
  idParamChain(),
  body('reason')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('El motivo no puede superar los 255 caracteres.'),
  handleValidationErrors,
];

/** GET /api/professional/patients/:id/symptoms */
const listPatientSymptomsValidator = [
  idParamChain(),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('La categoría no es válida.'),
  ...dateRangeChains(),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

/** GET /api/professional/observations */
const listObservationsValidator = [
  query('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El paciente no es válido.'),
  ...paginationChains(),
  handleValidationErrors,
];

/** Shared observation field chains (without patientId). */
const observationFieldChains = (isCreate) => [
  requiredOnCreate(body('title'), isCreate, 'El título es obligatorio.')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('El título debe tener entre 3 y 150 caracteres.'),
  requiredOnCreate(body('content'), isCreate, 'El contenido es obligatorio.')
    .trim()
    .isLength({ min: 3, max: 5000 })
    .withMessage('El contenido debe tener entre 3 y 5000 caracteres.'),
  body('visibleToPatient')
    .optional()
    .isBoolean()
    .withMessage('La visibilidad debe ser true o false.'),
];

/** POST /api/professional/observations */
const createObservationValidator = [
  patientIdBodyChain(),
  ...observationFieldChains(true),
  handleValidationErrors,
];

/** PUT /api/professional/observations/:id — patientId immutable. */
const updateObservationValidator = [
  idParamChain(),
  ...observationFieldChains(false),
  handleValidationErrors,
];

/** GET lists filtered by treatment-style status. */
const statusFilterValidator = [
  query('status')
    .optional()
    .isIn(Object.values(TREATMENT_STATUS))
    .withMessage('El estado no es válido.'),
  query('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El paciente no es válido.'),
  ...paginationChains(),
  ...sortingChains(),
  handleValidationErrors,
];

/** Shared treatment field chains (without patientId). */
const treatmentFieldChains = (isCreate) => [
  requiredOnCreate(body('title'), isCreate, 'El título es obligatorio.')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres.'),
  /* NOT NULL in schema — required on create, editable afterwards. */
  requiredOnCreate(body('description'), isCreate, 'La descripción es obligatoria.')
    .trim()
    .isLength({ min: 3, max: 5000 })
    .withMessage('La descripción debe tener entre 3 y 5000 caracteres.'),
  body('startDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha de inicio no es válida.'),
  body('endDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha de término no es válida.'),
];

/** POST /api/professional/treatments */
const createTreatmentValidator = [
  patientIdBodyChain(),
  ...treatmentFieldChains(true),
  handleValidationErrors,
];

/** PUT /api/professional/treatments/:id — patientId immutable. */
const updateTreatmentValidator = [
  idParamChain(),
  ...treatmentFieldChains(false),
  body('status')
    .optional()
    .isIn(Object.values(TREATMENT_STATUS))
    .withMessage('El estado del tratamiento no es válido.'),
  handleValidationErrors,
];

/** Required-on-create medication id body chain. */
const medicationIdBodyChain = () =>
  body('medicationId')
    .notEmpty()
    .withMessage('El medicamento es obligatorio.')
    .isInt({ min: 1 })
    .withMessage('El medicamento no es válido.');

/** Shared prescription field chains (without patient/medication ids). */
const prescriptionFieldChains = (isCreate) => [
  requiredOnCreate(body('dosage'), isCreate, 'La dosis es obligatoria.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La dosis debe tener entre 1 y 100 caracteres.'),
  requiredOnCreate(body('frequency'), isCreate, 'La frecuencia es obligatoria.')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La frecuencia debe tener entre 1 y 100 caracteres.'),
  body('instructions')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las instrucciones no pueden superar los 2000 caracteres.'),
  body('startDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha de inicio no es válida.'),
  body('endDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('La fecha de término no es válida.'),
];

/** POST /api/professional/medications */
const createPrescriptionValidator = [
  patientIdBodyChain(),
  medicationIdBodyChain(),
  ...prescriptionFieldChains(true),
  handleValidationErrors,
];

/** PUT /api/professional/medications/:id — patient/medication immutable. */
const updatePrescriptionValidator = [
  idParamChain(),
  ...prescriptionFieldChains(false),
  body('status')
    .optional()
    .isIn(Object.values(TREATMENT_STATUS))
    .withMessage('El estado de la receta no es válido.'),
  handleValidationErrors,
];

/** GET /api/professional/routines/catalog */
const routineCatalogValidator = [
  query('type')
    .optional()
    .isIn(Object.values(ROUTINE_TYPES))
    .withMessage('El tipo de rutina no es válido.'),
  handleValidationErrors,
];

/** Required-on-create routine id body chain. */
const routineIdBodyChain = () =>
  body('routineId')
    .notEmpty()
    .withMessage('La rutina es obligatoria.')
    .isInt({ min: 1 })
    .withMessage('La rutina no es válida.');

/** Shared routine assignment field chains (without patient/routine ids). */
const routineAssignmentFieldChains = (isCreate) => [
  requiredOnCreate(body('schedule'), isCreate, 'El horario es obligatorio.')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('El horario debe tener entre 1 y 200 caracteres.'),
  /* Column is `instructions` — keep API field aligned with schema. */
  body('instructions')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Las instrucciones no pueden superar los 2000 caracteres.'),
];

/** POST /api/professional/routines */
const createRoutineAssignmentValidator = [
  patientIdBodyChain(),
  routineIdBodyChain(),
  ...routineAssignmentFieldChains(true),
  handleValidationErrors,
];

/** PUT /api/professional/routines/:id — patient/routine immutable. */
const updateRoutineAssignmentValidator = [
  idParamChain(),
  ...routineAssignmentFieldChains(false),
  body('status')
    .optional()
    .isIn(Object.values(TREATMENT_STATUS))
    .withMessage('El estado de la rutina no es válido.'),
  handleValidationErrors,
];

/** GET /api/professional/medications/catalog */
const medicationCatalogValidator = [
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('La búsqueda no puede superar los 100 caracteres.'),
  handleValidationErrors,
];

module.exports = {
  updateProfileValidator,
  listPatientsValidator,
  linkPatientValidator,
  updateAssignmentValidator,
  listAppointmentsValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  listPatientSymptomsValidator,
  listObservationsValidator,
  createObservationValidator,
  updateObservationValidator,
  statusFilterValidator,
  createTreatmentValidator,
  updateTreatmentValidator,
  createPrescriptionValidator,
  updatePrescriptionValidator,
  routineCatalogValidator,
  createRoutineAssignmentValidator,
  updateRoutineAssignmentValidator,
  medicationCatalogValidator,
};
