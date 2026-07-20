/**
 * Form helpers shared by every auth/contact form:
 * - read values, show/clear field errors (using the aria slots
 *   rendered by Input/Textarea/Select components)
 * - map ApiError field errors back onto inputs.
 */

/**
 * Reads all named fields of a form into a plain object (trimmed).
 * @param {HTMLFormElement} form
 * @returns {Record<string, string>}
 */
export const readForm = (form) => {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = typeof value === 'string' ? value.trim() : value;
  });
  return data;
};

/**
 * Shows an error message under a field.
 * @param {string} name - Field name/id.
 * @param {string} message
 */
export const showFieldError = (name, message) => {
  const slot = document.getElementById(`${name}-error`);
  const input = document.getElementById(name);
  if (slot) {
    slot.textContent = message;
    slot.classList.remove('hidden');
  }
  if (input) input.setAttribute('aria-invalid', 'true');
};

/**
 * Clears every field error inside a form.
 * @param {HTMLFormElement} form
 */
export const clearFieldErrors = (form) => {
  form.querySelectorAll('[id$="-error"]').forEach((slot) => {
    slot.textContent = '';
    slot.classList.add('hidden');
  });
  form.querySelectorAll('[aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
};

/**
 * Applies a map of field errors, then focuses the first invalid field.
 * @param {Record<string, string>} errors
 */
export const applyFieldErrors = (errors) => {
  const fields = Object.keys(errors);
  fields.forEach((field) => showFieldError(field, errors[field]));
  const first = document.getElementById(fields[0]);
  if (first) first.focus();
};

/**
 * Maps ApiError.errors ([{field, message}]) onto form fields.
 * @param {Array<{field: string, message: string}>} apiErrors
 */
export const applyApiErrors = (apiErrors = []) => {
  const errors = {};
  apiErrors.forEach(({ field, message }) => {
    if (field && !errors[field]) errors[field] = message;
  });
  if (Object.keys(errors).length > 0) applyFieldErrors(errors);
};

/**
 * Toggles a submit button into loading state.
 * @param {HTMLButtonElement} button
 * @param {boolean} loading
 * @param {string} [loadingLabel]
 */
export const setSubmitting = (button, loading, loadingLabel = 'Procesando…') => {
  if (!button) return;
  if (loading) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = loadingLabel;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
  }
};
