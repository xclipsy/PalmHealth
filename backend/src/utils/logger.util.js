/**
 * Registrador interno de la aplicación.
 *
 * Centraliza todos los registros (logs) emitidos por el backend para
 * mantener un formato consistente y permitir agregar futuros destinos
 * (archivos, servicios externos, etc.) desde un único lugar, sin
 * modificar la lógica de negocio.
 *
 * Reglas (Parte 6 de la especificación):
 * - Nunca registrar cuerpos de solicitudes, contraseñas, tokens ni datos médicos.
 * - Los errores se registran internamente con información completa en
 *   desarrollo y únicamente con el mensaje en producción.
 */

const { env } = require('../config/env.config');

/**
 * Niveles de severidad de los registros (logs).
 */
const LOG_LEVELS = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
});

/**
 * Formatea una línea de registro con la marca de tiempo, el nivel de
 * severidad y el prefijo del servicio.
 *
 * @param {string} level - Uno de los valores de LOG_LEVELS.
 * @param {string} message - Mensaje del registro (en inglés, de uso interno).
 * @returns {string} La línea de registro formateada.
 */
const formatLine = (level, message) =>
  `[${new Date().toISOString()}] [palm-health-api] [${level}] ${message}`;

const logger = {
/**
 * Registra un mensaje informativo.
 *
 * @param {string} message
 */
  info(message) {
    // eslint-disable-next-line no-console
    console.log(formatLine(LOG_LEVELS.INFO, message));
  },

/**
 * Registra una advertencia.
 *
 * @param {string} message
 */
  warn(message) {
    // eslint-disable-next-line no-console
    console.warn(formatLine(LOG_LEVELS.WARN, message));
  },

  /**
 * Registra un error. En desarrollo se incluye el objeto de error completo
 * (con stack); en producción solo se registra el mensaje para evitar que
 * detalles internos sensibles lleguen a los logs agregados.
 *
 * @param {string} message - Contexto del fallo.
 * @param {Error} [error] - Error original, si está disponible.
 */
  error(message, error) {
    // eslint-disable-next-line no-console
    console.error(formatLine(LOG_LEVELS.ERROR, message));
    if (error) {
      // eslint-disable-next-line no-console
      console.error(env.nodeEnv === 'production' ? error.message : error);
    }
  },

/**
 * Registra un mensaje de depuración. Silencioso en producción.
 *
 * @param {string} message
 */
  debug(message) {
    if (env.nodeEnv !== 'production') {
      // eslint-disable-next-line no-console
      console.log(formatLine(LOG_LEVELS.DEBUG, message));
    }
  },
};

module.exports = { logger, LOG_LEVELS };
