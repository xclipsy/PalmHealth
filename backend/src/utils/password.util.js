/**
 * Utilidades de hash de contraseñas (Parte 3 de la especificación).
 *
 * Utiliza bcrypt con un factor de costo configurable
 * (BCRYPT_SALT_ROUNDS, valor predeterminado 12). Las contraseñas en
 * texto plano solo existen en memoria durante la solicitud que las
 * recibe; nunca se almacenan ni se registran en logs.
 */

const bcrypt = require('bcrypt');
const { env } = require('../config/env.config');

/**
 * Genera el hash de una contraseña en texto plano.
 *
 * @param {string} plainPassword
 * @returns {Promise<string>} Hash bcrypt (incluye salt + factor de costo).
 */
const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, env.bcryptSaltRounds);

/**
 * Compara una contraseña en texto plano con un hash almacenado usando
 * tiempo constante (gestionado internamente por bcrypt).
 *
 * @param {string} plainPassword - Contraseña candidata enviada en la solicitud de inicio de sesión.
 * @param {string} passwordHash - Hash bcrypt almacenado.
 * @returns {Promise<boolean>} True cuando la contraseña coincide.
 */
const comparePassword = (plainPassword, passwordHash) =>
  bcrypt.compare(plainPassword, passwordHash);

module.exports = { hashPassword, comparePassword };
