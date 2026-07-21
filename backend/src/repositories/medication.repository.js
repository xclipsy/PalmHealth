/**
 * Medication repository — owns all SQL against medications (catalog)
 * and patient_medications (prescriptions). Prescription history is
 * always preserved (Part 5): status transitions + soft delete only.
 */

const { BaseRepository } = require('./base.repository');

const PRESCRIPTION_SELECT = `
  SELECT pm.*,
         m.name        AS medication_name,
         m.description AS medication_description,
         p.first_name  AS patient_first_name,
         p.last_name   AS patient_last_name,
         pr.first_name AS professional_first_name,
         pr.last_name  AS professional_last_name
    FROM patient_medications pm
    JOIN medications m    ON m.id  = pm.medication_id
    JOIN patients p       ON p.id  = pm.patient_id
    JOIN professionals pr ON pr.id = pm.professional_id
`;

class MedicationRepository extends BaseRepository {
  constructor() {
    super('patient_medications');
  }

  /**
   * Lists the medication catalog (optionally filtered by name search).
   * @param {string} [search]
   * @returns {Promise<Array<Object>>}
   */
  async findCatalog(search) {
    if (search) {
      const result = await this.execute(
        `SELECT id, name, description FROM medications
          WHERE deleted_at IS NULL AND name ILIKE $1
          ORDER BY name ASC`,
        [`%${search}%`]
      );
      return result.rows;
    }
    const result = await this.execute(
      `SELECT id, name, description FROM medications
        WHERE deleted_at IS NULL ORDER BY name ASC`
    );
    return result.rows;
  }

  /**
   * Checks a catalog medication exists.
   * @param {number} medicationId
   * @returns {Promise<boolean>}
   */
  async medicationExists(medicationId) {
    const result = await this.execute(
      'SELECT 1 FROM medications WHERE id = $1 AND deleted_at IS NULL',
      [medicationId]
    );
    return result.rowCount > 0;
  }

  /**
   * Lists prescriptions with filters and pagination.
   * @param {Object} filters - { patientId, professionalId, status }.
   * @param {Object} options - { limit, offset }.
   * @returns {Promise<{ rows: Array<Object>, total: number }>}
   */
  async findPrescriptions(filters, { limit, offset }) {
    const conditions = ['pm.deleted_at IS NULL'];
    const params = [];

    if (filters.patientId) {
      params.push(filters.patientId);
      conditions.push(`pm.patient_id = $${params.length}`);
    }
    if (filters.professionalId) {
      params.push(filters.professionalId);
      conditions.push(`pm.professional_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`pm.status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total FROM patient_medications pm ${where}`,
      params
    );

    const listResult = await this.execute(
      `${PRESCRIPTION_SELECT} ${where}
       ORDER BY pm.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }

  /**
   * Finds one prescription (with names) by id.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findPrescriptionById(id) {
    const result = await this.execute(
      `${PRESCRIPTION_SELECT} WHERE pm.id = $1 AND pm.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Creates a prescription.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async createPrescription(data) {
    const result = await this.execute(
      `INSERT INTO patient_medications
         (patient_id, medication_id, professional_id, treatment_id,
          dosage, frequency, instructions, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE), $9)
       RETURNING *`,
      [
        data.patientId,
        data.medicationId,
        data.professionalId,
        data.treatmentId || null,
        data.dosage,
        data.frequency,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Updates a prescription (dosage, schedule and/or status).
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async updatePrescription(id, data) {
    const result = await this.execute(
      `UPDATE patient_medications
          SET dosage       = COALESCE($2, dosage),
              frequency    = COALESCE($3, frequency),
              instructions = COALESCE($4, instructions),
              start_date   = COALESCE($5, start_date),
              end_date     = COALESCE($6, end_date),
              status       = COALESCE($7, status),
              updated_at   = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        /* `|| null` filters empty strings: Postgres rejects '' as a date,
           and COALESCE keeps the current value when null is passed. */
        id,
        data.dosage || null,
        data.frequency || null,
        data.instructions || null,
        data.startDate || null,
        data.endDate || null,
        data.status || null,
      ]
    );
    return result.rows[0] || null;
  }
}

module.exports = { MedicationRepository, medicationRepository: new MedicationRepository() };
