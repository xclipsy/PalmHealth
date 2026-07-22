/**
 * Client-side form validators.
 * Mirror of the backend validation rules (Part 3) so users get
 * instant feedback; the server always re-validates.
 * All user-facing messages are in Spanish.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Password policy: 8+ chars, upper, lower, digit, special (Part 3). */
const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, message: 'Mínimo 8 caracteres.' },
  { test: (v) => /[A-Z]/.test(v), message: 'Al menos una mayúscula.' },
  { test: (v) => /[a-z]/.test(v), message: 'Al menos una minúscula.' },
  { test: (v) => /\d/.test(v), message: 'Al menos un número.' },
  { test: (v) => /[^A-Za-z0-9]/.test(v), message: 'Al menos un carácter especial.' },
];

/**
 * @param {string} value
 * @returns {string|null} Error message or null when valid.
 */
export const validateEmail = (value) => {
  if (!value || !value.trim()) return 'El correo electrónico es obligatorio.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'El correo electrónico no es válido.';
  return null;
};

/**
 * @param {string} value
 * @returns {string|null} First unmet rule message or null when valid.
 */
export const validatePassword = (value) => {
  if (!value) return 'La contraseña es obligatoria.';
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
  return failed ? `La contraseña no cumple: ${failed.message}` : null;
};

/**
 * @param {string} password
 * @param {string} confirmation
 * @returns {string|null}
 */
export const validatePasswordConfirmation = (password, confirmation) => {
  if (!confirmation) return 'Debes confirmar la contraseña.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
};

/**
 * @param {string} value
 * @param {string} label - Field label used in the message.
 * @returns {string|null}
 */
export const validateRequired = (value, label) => {
  if (!value || !String(value).trim()) return `${label} es obligatorio.`;
  return null;
};

/**
 * Validates a date is in the past (birth dates).
 * @param {string} value - ISO date string from an <input type="date">.
 * @returns {string|null}
 */
export const validatePastDate = (value) => {
  if (!value) return 'La fecha de nacimiento es obligatoria.';
  if (new Date(value) >= new Date()) return 'La fecha debe ser anterior a hoy.';
  return null;
};

/**
 * Runs a map of field -> validator results and collects errors.
 * @param {Record<string, string|null>} results
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export const collectErrors = (results) => {
  const errors = {};
  for (const [field, message] of Object.entries(results)) {
    if (message) errors[field] = message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
