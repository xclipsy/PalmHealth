/**
 * Repositorio de rutinas: gestiona todo el SQL de routines (catálogo)
 * y patient_routines (asignaciones).
 *
 * Los pacientes consultan; los profesionales administran.
 */
const { BaseRepository } = require('./base.repository');

const ASSIGNMENT_SELECT = `
  SELECT prt.*,
         r.name        AS routine_name,
         r.type        AS routine_type,
         r.description AS routine_description,
         p.first_name  AS patient_first_name,
         p.last_name   AS patient_last_name,
         pr.first_name AS professional_first_name,
         pr.last_name  AS professional_last_name
    FROM patient_routines prt
    JOIN routines r       ON r.id  = prt.routine_id
    JOIN patients p       ON p.id  = prt.patient_id
    JOIN professionals pr ON pr.id = prt.professional_id
`;

class RoutineRepository extends BaseRepository {
  constructor() {
    super('patient_routines');
  }

/**
 * Lista el catálogo de rutinas, con filtro opcional por tipo.
 *
 * @param {string} [type] - EXERCISE | NUTRITION | LIFESTYLE.
 * @returns {Promise<Array<Object>>}
 */
  async findCatalog(type) {
    if (type) {
      const result = await this.execute(
        `SELECT id, name, type, description FROM routines
          WHERE deleted_at IS NULL AND type = $1 ORDER BY name ASC`,
        [type]
      );
      return result.rows;
    }
    const result = await this.execute(
      `SELECT id, name, type, description FROM routines
        WHERE deleted_at IS NULL ORDER BY type ASC, name ASC`
    );
    return result.rows;
  }
/**
 * Verifica que una rutina del catálogo exista.
 *
 * @param {number} routineId
 * @returns {Promise<boolean>}
 */
  async routineExists(routineId) {
    const result = await this.execute(
      'SELECT 1 FROM routines WHERE id = $1 AND deleted_at IS NULL',
      [routineId]
    );
    return result.rowCount > 0;
  }

/**
 * Lista asignaciones de rutinas con filtros y paginación.
 *
 * @param {Object} filters - { patientId, professionalId, status }.
 * @param {Object} options - { limit, offset }.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
  async findAssignments(filters, { limit, offset }) {
    const conditions = ['prt.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`prt.patient_id = $${params.length}`);
    }
    if (filters.professionalId) {
      params.push(filters.professionalId);
      conditions.push(`prt.professional_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`prt.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM patient_routines prt ${where}`,
      params
    );

    const listResult = await this.execute(
      `${ASSIGNMENT_SELECT} ${where}
       ORDER BY prt.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
 * Busca una asignación de rutina por ID incluyendo nombres relacionados.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
  async findAssignmentById(id) {
    const result = await this.execute(
      `${ASSIGNMENT_SELECT} WHERE prt.id = $1 AND prt.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

 /**
 * Asigna una rutina a un paciente.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
  async createAssignment(data) {
    const result = await this.execute(
      `INSERT INTO patient_routines
         (patient_id, routine_id, professional_id, treatment_id,
          schedule, instructions, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::date, CURRENT_DATE), $8)
       RETURNING *`,
      [
        data.patientId,
        data.routineId,
        data.professionalId,
        data.treatmentId || null,
        data.schedule,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
      ]
    );
    return result.rows[0];
  }

  /**
 * Actualiza una asignación de rutina (horario o estado).
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
  async updateAssignment(id, data) {
    const result = await this.execute(
      `UPDATE patient_routines
          SET schedule     = COALESCE($2, schedule),
              instructions = COALESCE($3, instructions),
              start_date   = COALESCE($4, start_date),
              end_date     = COALESCE($5, end_date),
              status       = COALESCE($6, status),
              updated_at   = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
       // `|| null` filtra cadenas vacías: PostgreSQL rechaza '' en fechas
       // y COALESCE mantiene el valor actual cuando recibe null.
        id,
        data.schedule || null,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
        data.status || null,
      ]
    );
    return result.rows[0] || null;
  }
}

module.exports = { RoutineRepository, routineRepository: new RoutineRepository() };
