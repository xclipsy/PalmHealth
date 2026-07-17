/**
 * Notification repository — owns all SQL against the notifications
 * table. Notifications are strictly scoped to their owner user.
 */

const { BaseRepository } = require('./base.repository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  /**
   * Lists notifications for one user with read-status filter.
   * @param {number} userId
   * @param {Object} filters - { isRead }.
   * @param {Object} options - { limit, offset }.
   * @returns {Promise<{ rows: Array<Object>, total: number }>}
   */
  async findByUser(userId, filters, { limit, offset }) {
    const conditions = ['deleted_at IS NULL', 'user_id = $1'];
    const params = [userId];

    if (filters.isRead !== undefined) {
      params.push(filters.isRead);
      conditions.push(`is_read = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM notifications ${where}`,
      params
    );

    const listResult = await this.execute(
      `SELECT * FROM notifications ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
   * Counts unread notifications for one user (dashboard widget).
   * @param {number} userId
   * @returns {Promise<number>}
   */
  async countUnread(userId) {
    return this.count('AND user_id = $1 AND is_read = FALSE', [userId]);
  }

  /**
   * Creates a notification for a user.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const result = await this.execute(
      `INSERT INTO notifications
         (user_id, type, title, message, related_entity, related_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.userId,
        data.type,
        data.title,
        data.message,
        data.relatedEntity || null,
        data.relatedId || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Marks one notification as read — only if it belongs to the user.
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  async markAsRead(id, userId) {
    const result = await this.execute(
      `UPDATE notifications
          SET is_read = TRUE, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Soft-deletes one notification — only if it belongs to the user.
   * @param {number} id
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async softDeleteForUser(id, userId) {
    const result = await this.execute(
      `UPDATE notifications
          SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );
    return result.rowCount > 0;
  }
}

module.exports = {
  NotificationRepository,
  notificationRepository: new NotificationRepository(),
};
