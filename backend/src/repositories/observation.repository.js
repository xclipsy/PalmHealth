/**
 * Observation repository — owns all SQL against the observations table.
 * Observations belong to their authoring professional; patients see
 * only rows flagged visible_to_patient (Part 5).
 */

const { BaseRepository } = require('./base.repository');

const BASE_SELECT = `
  SELECT o.*,
         p.first_name  AS patient_first_name,
         p.last_name   AS patient_last_name,
         pr.first_name AS professional_first_name,
         pr.last_name  AS professional_last_name
    FROM observations o
    JOIN patients p       ON p.id  = o.patient_id
    JOIN professionals pr ON pr.id = o.professional_id
`;

class ObservationRepository extends BaseRepository {
  constructor() {
    super('observations');
  }

  /**
   * Lists observations with filters and pagination.
   * @param {Object} filters - { patientId, professionalId, visibleToPatient }.
   * @param {Object} options - { limit, offset }.
   * @returns {Promise<{ rows: Array<Object>, total: number }>}
   */
  async findAll(filters, { limit, offset }) {
    const conditions = ['o.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`o.patient_id = $${params.length}`);
    }
    if (filters.professionalId) {
      params.push(filters.professionalId);
      conditions.push(`o.professional_id = $${params.length}`);
    }
    if (filters.visibleToPatient !== undefined) {
      params.push(filters.visibleToPatient);
      conditions.push(`o.visible_to_patient = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM observations o ${where}`,
      params
    );

    const listResult = await this.execute(
      `${BASE_SELECT} ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
   * Finds one observation (with names) by id.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findDetailedById(id) {
    const result = await this.execute(
      `${BASE_SELECT} WHERE o.id = $1 AND o.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates an observation.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const result = await this.execute(
      `INSERT INTO observations
         (patient_id, professional_id, treatment_id, title, content,
          visible_to_patient)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.patientId,
        data.professionalId,
        data.treatmentId || null,
        data.title,
        data.content,
        data.visibleToPatient ?? false,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates an observation. Authorship is enforced in the service
   * layer (only the authoring professional may edit).
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const result = await this.execute(
      `UPDATE observations
          SET title              = COALESCE($2, title),
              content            = COALESCE($3, content),
              visible_to_patient = COALESCE($4, visible_to_patient),
              updated_at         = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [id, data.title ?? null, data.content ?? null, data.visibleToPatient ?? null]
    );
    return result.rows[0] || null;
  }
}

module.exports = {
  ObservationRepository,
  observationRepository: new ObservationRepository(),
};
