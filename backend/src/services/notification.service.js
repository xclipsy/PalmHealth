/**
 * Notification service — business logic for the notification center
 * plus the internal emitters other services call when clinical events
 * happen (appointment scheduled, symptom logged, treatment assigned).
 */

const { notificationRepository } = require('../repositories/notification.repository');
const { NotFoundError } = require('../errors/app.errors');
const { NOTIFICATION_TYPES } = require('../constants/app.constants');
const { logger } = require('../utils/logger.util');

/**
 * Lists the caller's notifications with read-status filter.
 * @param {number} userId
 * @param {Object} filters - { isRead }.
 * @param {Object} pagination - { limit, offset }.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
const listForUser = (userId, filters, pagination) =>
  notificationRepository.findByUser(userId, filters, pagination);

/**
 * Marks one of the caller's notifications as read.
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<Object>}
 */
const markAsRead = async (id, userId) => {
  const updated = await notificationRepository.markAsRead(id, userId);
  if (!updated) {
    throw new NotFoundError('La notificación no existe.');
  }
  return updated;
};

/**
 * Removes one of the caller's notifications (soft delete).
 * @param {number} id
 * @param {number} userId
 * @returns {Promise<void>}
 */
const remove = async (id, userId) => {
  const removed = await notificationRepository.softDeleteForUser(id, userId);
  if (!removed) {
    throw new NotFoundError('La notificación no existe.');
  }
};

/**
 * Internal emitter used by other services. Failures are logged but
 * never break the main business operation (a lost notification must
 * not roll back an appointment or prescription).
 * @param {Object} data - { userId, type, title, message, relatedEntity, relatedId }.
 * @returns {Promise<void>}
 */
const emit = async (data) => {
  try {
    await notificationRepository.create(data);
  } catch (error) {
    logger.error('Failed to create notification', { message: error.message });
  }
};

module.exports = { listForUser, markAsRead, remove, emit, NOTIFICATION_TYPES };
