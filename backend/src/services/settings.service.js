/**
 * Settings service — per-user preferences (both roles share it: the
 * settings row is keyed by user, not by role profile).
 */

const { settingsRepository } = require('../repositories/settings.repository');
const { NotFoundError } = require('../errors/app.errors');

/**
 * Gets the caller's settings, creating defaults on first access.
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const getForUser = (userId) => settingsRepository.findOrCreateByUserId(userId);

/**
 * Updates the caller's settings.
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const updateForUser = async (userId, data) => {
  // Ensure the row exists before updating (first-time writers).
  await settingsRepository.findOrCreateByUserId(userId);
  const updated = await settingsRepository.updateByUserId(userId, data);
  if (!updated) {
    throw new NotFoundError('La configuración no existe.');
  }
  return updated;
};

module.exports = { getForUser, updateForUser };
