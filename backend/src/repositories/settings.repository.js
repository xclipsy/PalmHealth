/**
 * Repositorio de configuración: gestiona todo el SQL de la tabla settings.
 *
 * Existe un registro por usuario; se crea automáticamente con valores
 * predeterminados en la primera consulta.
 */

const { BaseRepository } = require('./base.repository');

class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings');
  }

 /**
 * Busca la configuración de un usuario y la crea con valores
 * predeterminados si no existe (upsert mantiene el endpoint idempotente
 * y seguro ante condiciones de carrera).
 *
 * @param {number} userId
 * @returns {Promise<Object>}
 */
  async findOrCreateByUserId(userId) {
    const result = await this.execute(
      `INSERT INTO settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = settings.updated_at
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

 /**
 * Actualiza la configuración de un usuario.
 *
 * @param {number} userId
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
  async updateByUserId(userId, data) {
    const result = await this.execute(
      `UPDATE settings
          SET language              = COALESCE($2, language),
              timezone              = COALESCE($3, timezone),
              theme                 = COALESCE($4, theme),
              notifications_enabled = COALESCE($5, notifications_enabled),
              email_notifications   = COALESCE($6, email_notifications),
              updated_at            = NOW()
        WHERE user_id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        userId,
        data.language ?? null,
        data.timezone ?? null,
        data.theme ?? null,
        data.notificationsEnabled ?? null,
        data.emailNotifications ?? null,
      ]
    );
    return result.rows[0] || null;
  }
}

module.exports = { SettingsRepository, settingsRepository: new SettingsRepository() };
