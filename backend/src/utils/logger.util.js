/**
 * Internal application logger.
 *
 * Centralizes every log emitted by the backend so the format is
 * consistent and future transports (files, external services) can be
 * added in one place without touching business code.
 *
 * Rules (Part 6 of the specification):
 * - Never log request bodies, passwords, tokens or medical data.
 * - Errors are logged internally with full detail in development and
 *   with message-only detail in production.
 */

const { env } = require('../config/env.config');

/** Log severity levels. */
const LOG_LEVELS = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
});

/**
 * Formats a log line with timestamp, level and service prefix.
 * @param {string} level - One of LOG_LEVELS.
 * @param {string} message - Log message (English, internal-facing).
 * @returns {string} The formatted log line.
 */
const formatLine = (level, message) =>
  `[${new Date().toISOString()}] [palm-health-api] [${level}] ${message}`;

const logger = {
  /**
   * Logs an informational message.
   * @param {string} message
   */
  info(message) {
    // eslint-disable-next-line no-console
    console.log(formatLine(LOG_LEVELS.INFO, message));
  },

  /**
   * Logs a warning.
   * @param {string} message
   */
  warn(message) {
    // eslint-disable-next-line no-console
    console.warn(formatLine(LOG_LEVELS.WARN, message));
  },

  /**
   * Logs an error. In development the full error object (with stack)
   * is included; in production only the message is logged so no
   * sensitive internals leak into aggregated logs.
   * @param {string} message - Context of the failure.
   * @param {Error} [error] - The original error, if available.
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
   * Logs a debug message. Silent in production.
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
