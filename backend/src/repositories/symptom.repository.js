/**
 * Symptom repository — owns all SQL against symptoms and
 * symptom_categories. Symptoms are the only clinical entity a patient
 * can write (Part 4).
 */

const { BaseRepository } = require('./base.repository');

const SORTABLE_COLUMNS = Object.freeze({
  occurred_at: 's.occurred_at',
  intensity: 's.intensity',
  created_at: 's.created_at',
});

const BASE_SELECT = `
  SELECT s.*, c.name AS category_name
    FROM symptoms s
    JOIN symptom_categories c ON c.id = s.category_id
`;

class SymptomRepository extends BaseRepository {
  constructor() {
    super('symptoms');
  }

  /**
   * Builds shared WHERE fragment + params for list/count.
   * @param {Object} filters
   * @returns {{ where: string, params: Array<*> }}
   */
  buildFilters(filters) {
    const conditions = ['s.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`s.patient_id = $${params.length}`);
    }
    if (filters.categoryId) {
      params.push(filters.categoryId);
      conditions.push(`s.category_id = $${params.length}`);
    }
    if (filters.minIntensity) {
      params.push(filters.minIntensity);
      conditions.push(`s.intensity >= $${params.length}`);
    }
    if (filters.from) {
      params.push(filters.from);
      conditions.push(`s.occurred_at >= $${params.length}`);
    }
    if (filters.to) {
      params.push(filters.to);
      conditions.push(`s.occurred_at <= $${params.length}`);
    }

    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }

  /**
   * Lists symptoms with filters, sorting and pagination.
   * @param {Object} filters
   * @param {Object} options - { limit, offset, sort, order }.
   * @returns {Promise<{ rows: Array<Object>, total: number }>}
   */
  async findAll(filters, { limit, offset, sort = 'occurred_at', order = 'desc' }) {
    const { where, params } = this.buildFilters(filters);
    const sortColumn = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.occurred_at;
    const direction = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM symptoms s ${where}`,
      params
    );

    const listResult = await this.execute(
      `${BASE_SELECT} ${where}
       ORDER BY ${sortColumn} ${direction}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
   * Finds one symptom (with category name) by id.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findDetailedById(id) {
    const result = await this.execute(
      `${BASE_SELECT} WHERE s.id = $1 AND s.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a symptom entry.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const result = await this.execute(
      `INSERT INTO symptoms
         (patient_id, category_id, intensity, description, notes,
          body_zone, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()))
       RETURNING *`,
      [
        data.patientId,
        data.categoryId,
        data.intensity,
        data.description,
        data.notes || null,
        data.bodyZone || null,
        data.occurredAt || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates a symptom entry.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    const result = await this.execute(
      `UPDATE symptoms
          SET category_id = COALESCE($2, category_id),
              intensity   = COALESCE($3, intensity),
              description = COALESCE($4, description),
              notes       = COALESCE($5, notes),
              body_zone   = COALESCE($6, body_zone),
              occurred_at = COALESCE($7, occurred_at),
              updated_at  = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        /* `|| null` filters empty strings: Postgres rejects '' as a
           timestamp, and COALESCE keeps the current value on null.
           `intensity` keeps ?? because 0 must not be swallowed. */
        id,
        data.categoryId || null,
        data.intensity ?? null,
        data.description || null,
        data.notes || null,
        data.bodyZone || null,
        data.occurredAt || null,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Lists all active symptom categories (catalog).
   * @returns {Promise<Array<Object>>}
   */
  async findAllCategories() {
    const result = await this.execute(
      `SELECT id, name, description
         FROM symptom_categories
        WHERE deleted_at IS NULL
        ORDER BY name ASC`
    );
    return result.rows;
  }

  /**
   * Checks a category exists (validators use this for 422 messages).
   * @param {number} categoryId
   * @returns {Promise<boolean>}
   */
  async categoryExists(categoryId) {
    const result = await this.execute(
      'SELECT 1 FROM symptom_categories WHERE id = $1 AND deleted_at IS NULL',
      [categoryId]
    );
    return result.rowCount > 0;
  }
}

module.exports = { SymptomRepository, symptomRepository: new SymptomRepository() };
