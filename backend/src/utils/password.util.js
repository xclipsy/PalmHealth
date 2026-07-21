/**
 * Password hashing helpers (Part 3 of the specification).
 *
 * bcrypt with a configurable cost factor (BCRYPT_SALT_ROUNDS, default
 * 12). Plain-text passwords exist only in memory during the request
 * that carries them — they are never persisted or logged.
 */

const bcrypt = require('bcrypt');
const { env } = require('../config/env.config');

/**
 * Hashes a plain-text password.
 * @param {string} plainPassword
 * @returns {Promise<string>} bcrypt hash (includes salt + cost factor).
 */
const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, env.bcryptSaltRounds);

/**
 * Compares a plain-text candidate against a stored hash in constant
 * time (handled internally by bcrypt).
 * @param {string} plainPassword - Candidate from the login request.
 * @param {string} passwordHash - Stored bcrypt hash.
 * @returns {Promise<boolean>} True when the password matches.
 */
const comparePassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);

module.exports = { hashPassword, comparePassword };
