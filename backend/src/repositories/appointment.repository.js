/**
 * Appointment repository — owns all SQL against the appointments table.
 * Joins pull the counterpart names so list endpoints need no extra
 * round trips. All queries are parameterized and soft-delete aware.
 */

const { BaseRepository } = require('./base.repository');
const { APPOINTMENT_DEFAULTS } = require('../constants/app.constants');

/** Whitelisted sort columns (guards against SQL injection via `sort`). */
const SORTABLE_COLUMNS = Object.freeze({
  scheduled_at: 'a.scheduled_at',
  status: 'a.status',
  created_at: 'a.created_at',
});

const BASE_SELECT = `
  SELECT a.*,
         p.first_name  AS patient_first_name,
         p.last_name   AS patient_last_name,
         pr.first_name AS professional_first_name,
         pr.last_name  AS professional_last_name,
         pr.specialty  AS professional_specialty
    FROM appointments a
    JOIN patients p       ON p.id  = a.patient_id
    JOIN professionals pr ON pr.id = a.professional_id
`;

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('appointments');
  }

  /**
   * Builds the WHERE fragment + params shared by list and count.
   * @param {Object} filters
   * @returns {{ where: string, params: Array<*> }}
   */
  buildFilters(filters) {
    const conditions = ['a.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`a.patient_id = $${params.length}`);
    }
    if (filters.professionalId) {
      params.push(filters.professionalId);
      conditions.push(`a.professional_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (filters.from) {
      params.push(filters.from);
      conditions.push(`a.scheduled_at >= $${params.length}`);
    }
    if (filters.to) {
      params.push(filters.to);
      conditions.push(`a.scheduled_at <= $${params.length}`);
    }

    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }

  /**
   * Lists appointments with filters, sorting and pagination.
   * @param {Object} filters - patientId/professionalId/status/from/to.
   * @param {Object} options - { limit, offset, sort, order }.
   * @returns {Promise<{ rows: Array<Object>, total: number }>}
   */
  async findAll(filters, { limit, offset, sort = 'scheduled_at', order = 'asc' }) {
    const { where, params } = this.buildFilters(filters);
    const sortColumn = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.scheduled_at;
    const direction = order === 'desc' ? 'DESC' : 'ASC';

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM appointments a ${where}`,
      params
    );

    const listParams = [...params, limit, offset];
    const listResult = await this.execute(
      `${BASE_SELECT} ${where}
       ORDER BY ${sortColumn} ${direction}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
   * Finds one appointment (with names) by id.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findDetailedById(id) {
    const result = await this.execute(
      `${BASE_SELECT} WHERE a.id = $1 AND a.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates an appointment.
   * @param {Object} data
   * @returns {Promise<Object>} The created row.
   */
  async create(data) {
    const result = await this.execute(
      `INSERT INTO appointments
         (patient_id, professional_id, scheduled_at, duration_minutes,
          reason, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.patientId,
        data.professionalId,
        data.scheduledAt,
        data.durationMinutes ?? APPOINTMENT_DEFAULTS.DURATION_MINUTES,
        data.reason,
        data.location || null,
        data.notes || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates editable fields of an appointment.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>} The updated row or null.
   */
  async update(id, data) {
    const result = await this.execute(
      `UPDATE appointments
          SET scheduled_at     = COALESCE($2, scheduled_at),
              duration_minutes = COALESCE($3, duration_minutes),
              reason           = COALESCE($4, reason),
              location         = COALESCE($5, location),
              notes            = COALESCE($6, notes),
              status           = COALESCE($7, status),
              updated_at       = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        /* `|| null` filters empty strings: Postgres rejects '' as a
           timestamp, and COALESCE keeps the current value on null. */
        id,
        data.scheduledAt || null,
        data.durationMinutes || null,
        data.reason || null,
        data.location || null,
        data.notes || null,
        data.status || null,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Cancels an appointment, storing the reason.
   * @param {number} id
   * @param {string} status - APPOINTMENT_STATUS.CANCELLED.
   * @param {string} [reason]
   * @returns {Promise<Object|null>} The updated row or null.
   */
  async cancel(id, status, reason) {
    const result = await this.execute(
      `UPDATE appointments
          SET status = $2, cancellation_reason = $3, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [id, status, reason || null]
    );
    return result.rows[0] || null;
  }
}

module.exports = {
  AppointmentRepository,
  appointmentRepository: new AppointmentRepository(),
};
