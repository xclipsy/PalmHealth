/**
 * Servicio de notificaciones: contiene la lógica de negocio del centro
 * de notificaciones y los emisores internos que otros servicios llaman
 * cuando ocurren eventos clínicos (cita programada, síntoma registrado,
 * tratamiento asignado).
 */

const { notificationRepository } = require('../repositories/notification.repository');
const { NotFoundError } = require('../errors/app.errors');
const { NOTIFICATION_TYPES } = require('../constants/app.constants');
const { logger } = require('../utils/logger.util');

/**
 * Lista las notificaciones del usuario solicitante con filtro por estado
 * de lectura.
 *
 * @param {number} userId
 * @param {Object} filters - { isRead }.
 * @param {Object} pagination - { limit, offset }.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
const listForUser = (userId, filters, pagination) =>
  notificationRepository.findByUser(userId, filters, pagination);
/**
 * Marca como leída una de las notificaciones del usuario solicitante.
 *
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
 * Elimina una de las notificaciones del usuario solicitante
 * (eliminación lógica mediante soft delete).
 *
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
 * Emisor interno utilizado por otros servicios. Los fallos se registran
 * en los logs, pero nunca interrumpen la operación principal de negocio
 * (una notificación perdida no debe revertir una cita o una receta).
 *
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
