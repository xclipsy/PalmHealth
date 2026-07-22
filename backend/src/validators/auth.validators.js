// Validadores de autenticación y cuenta con express-validator.
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation.middleware');

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
const PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.';

const emailChain = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El correo electrónico es obligatorio.')
    .isEmail()
    .withMessage('El formato del correo electrónico no es válido.')
    .normalizeEmail({ gmail_remove_dots: false });

const passwordChain = (field = 'password') =>
  body(field)
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(PASSWORD_MESSAGE)
    .matches(PASSWORD_PATTERN)
    .withMessage(PASSWORD_MESSAGE);

const passwordConfirmationChain = (field = 'passwordConfirmation', targetField = 'password') =>
  body(field)
    .notEmpty()
    .withMessage('La confirmación de contraseña es obligatoria.')
    .custom((value, { req }) => value === req.body[targetField])
    .withMessage('Las contraseñas no coinciden.');

const commonIdentityChains = () => [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar los 100 caracteres.'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio.')
    .isLength({ max: 100 })
    .withMessage('El apellido no puede superar los 100 caracteres.'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es obligatorio.')
    .isLength({ min: 7, max: 30 })
    .withMessage('El teléfono debe tener entre 7 y 30 caracteres.'),
  body('privacyAccepted')
    .equals('true')
    .withMessage('Debes aceptar la política de privacidad.'),
];

// Registro de Paciente
const registerPatientValidator = [
  emailChain(),
  passwordChain(),
  passwordConfirmationChain(),
  ...commonIdentityChains(),
  body('birthDate')
    .notEmpty()
    .withMessage('La fecha de nacimiento es obligatoria.')
    .isISO8601()
    .withMessage('La fecha de nacimiento no es válida.')
    .custom((value) => new Date(value) < new Date())
    .withMessage('La fecha de nacimiento debe ser anterior a hoy.'),
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

// Registro de Profesional
const registerProfessionalValidator = [
  emailChain(),
  passwordChain(),
  passwordConfirmationChain(),
  ...commonIdentityChains(),
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('El número de licencia médica es obligatorio.')
    .isLength({ max: 50 })
    .withMessage('El número de licencia no puede superar los 50 caracteres.'),
  body('specialty')
    .trim()
    .notEmpty()
    .withMessage('La especialidad es obligatoria.')
    .isLength({ max: 100 })
    .withMessage('La especialidad no puede superar los 100 caracteres.'),
  body('yearsExperience')
    .optional({ values: 'null' })
    .isInt({ min: 0, max: 80 })
    .withMessage('Los años de experiencia deben ser un número entre 0 y 80.'),
  body('clinicName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 200 })
    .withMessage('El nombre de la clínica es demasiado largo.'),
  handleValidationErrors,
];

// Inicio de Sesión
const loginValidator = [
  emailChain(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  handleValidationErrors,
];

// Cambio de Contraseña
const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria.'),
  passwordChain('newPassword'),
  passwordConfirmationChain('newPasswordConfirmation', 'newPassword'),
  handleValidationErrors,
];

module.exports = {
  registerPatientValidator,
  registerProfessionalValidator,
  loginValidator,
  changePasswordValidator,
};
