/**
 * Servicio de configuración: preferencias por usuario.
 * Compartido por ambos roles (la clave es el usuario, no el perfil de rol).
 */

const { settingsRepository } = require('../repositories/settings.repository');
const { NotFoundError } = require('../errors/app.errors');

/**
 * Obtiene la configuración del usuario, creando valores por defecto al primer acceso.
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getForUser = (userId) => settingsRepository.findOrCreateByUserId(userId);

/**
 * Actualiza la configuración del usuario.
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const updateForUser = async (userId, data) => {
 // Asegura que el registro exista antes de actualizar (creación en primer acceso).
  await settingsRepository.findOrCreateByUserId(userId);
  const updated = await settingsRepository.updateByUserId(userId, data);
  if (!updated) {
    throw new NotFoundError('La configuración no existe.');
  }
  return updated;
};

module.exports = { getForUser, updateForUser };
