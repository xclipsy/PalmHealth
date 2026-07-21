/**
 * Repositorio de tratamientos: gestiona todo el SQL de la tabla treatments.
 *
 * Los tratamientos son creados y administrados por profesionales; los
 * pacientes únicamente pueden consultarlos (Partes 4 y 5).
 */

const { BaseRepository } = require('./base.repository');

const SORTABLE_COLUMNS = Object.freeze({
  start_date: 't.start_date',
  status: 't.status',
  created_at: 't.created_at',
});

const BASE_SELECT = `
  SELECT t.*,
         p.first_name  AS patient_first_name,
         p.last_name   AS patient_last_name,
         pr.first_name AS professional_first_name,
         pr.last_name  AS professional_last_name
    FROM treatments t
    JOIN patients p       ON p.id  = t.patient_id
    JOIN professionals pr ON pr.id = t.professional_id
`;

class TreatmentRepository extends BaseRepository {
  constructor() {
    super('treatments');
  }

  /**
 * Construye el fragmento WHERE y los parámetros compartidos para
 * listar y contar.
 *
 * @param {Object} filters
 * @returns {{ where: string, params: Array<*> }}
 */
  buildFilters(filters) {
    const conditions = ['t.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`t.patient_id = $${params.length}`);
    }
    if (filters.professionalId) {
      params.push(filters.professionalId);
      conditions.push(`t.professional_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`t.status = $${params.length}`);
    }

    return { where: `WHERE ${conditions.join(' AND ')}`, params };
  }

  /**
 * Lista tratamientos con filtros, ordenamiento y paginación.
 *
 * @param {Object} filters
 * @param {Object} options - { limit, offset, sort, order }.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
  async findAll(filters, { limit, offset, sort = 'created_at', order = 'desc' }) {
    const { where, params } = this.buildFilters(filters);
    const sortColumn = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.created_at;
    const direction = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM treatments t ${where}`,
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
 * Busca un tratamiento por ID incluyendo nombres relacionados.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
  async findDetailedById(id) {
    const result = await this.execute(
      `${BASE_SELECT} WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

/**
 * Crea un tratamiento.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
  async create(data) {
    const result = await this.execute(
      `INSERT INTO treatments
         (patient_id, professional_id, title, description, instructions,
          start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE), $7)
       RETURNING *`,
      [
        data.patientId,
        data.professionalId,
        data.title,
        data.description || null,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
      ]
    );
    return result.rows[0];
  }

 /**
 * Actualiza un tratamiento (campos o estado).
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
  async update(id, data) {
    const result = await this.execute(
      `UPDATE treatments
          SET title        = COALESCE($2, title),
              description  = COALESCE($3, description),
              instructions = COALESCE($4, instructions),
              start_date   = COALESCE($5, start_date),
              end_date     = COALESCE($6, end_date),
              status       = COALESCE($7, status),
              updated_at   = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        /*
 * `|| null` filtra cadenas vacías: PostgreSQL rechaza '' en fechas
 * y COALESCE mantiene el valor actual cuando recibe null.
 */
        id,
        data.title || null,
        data.description || null,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
        data.status || null,
      ]
    );
    return result.rows[0] || null;
  }
}

module.exports = { TreatmentRepository, treatmentRepository: new TreatmentRepository() };
