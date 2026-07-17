/**
 * Assignment repository — owns all SQL against
 * patient_professional_assignments.
 *
 * This table is the source of truth for ownership authorization:
 * a professional may only touch data of patients with an ACTIVE
 * assignment (Parts 3 and 5 of the specification).
 */

const { BaseRepository } = require('./base.repository');
const { ASSIGNMENT_STATUS } = require('../constants/app.constants');

class AssignmentRepository extends BaseRepository {
  constructor() {
    super('patient_professional_assignments');
  }

  /**
   * Ownership check: is this professional actively assigned to this
   * patient? Used by the authorization layer before any clinical
   * resource of the patient is exposed.
   * @param {number} professionalId - professionals.id
   * @param {number} patientId - patients.id
   * @returns {Promise<boolean>}
   */
  async isProfessionalAssignedToPatient(professionalId, patientId) {
    const result = await this.execute(
      `SELECT 1
         FROM patient_professional_assignments
        WHERE professional_id = $1
          AND patient_id = $2
          AND status = $3
          AND deleted_at IS NULL
        LIMIT 1`,
      [professionalId, patientId, ASSIGNMENT_STATUS.ACTIVE]
    );
    return result.rowCount > 0;
  }

  /**
   * Finds the professional(s) actively assigned to a patient
   * (patient's "my professional" view, Part 4).
   * @param {number} patientId
   * @returns {Promise<Array<Object>>}
   */
  async findActiveProfessionalsForPatient(patientId) {
    const result = await this.execute(
      `SELECT pr.id, pr.user_id, pr.first_name, pr.last_name, pr.specialty,
              pr.clinic_name, pr.years_experience, ppa.assigned_at
         FROM patient_professional_assignments ppa
         JOIN professionals pr ON pr.id = ppa.professional_id
        WHERE ppa.patient_id = $1
          AND ppa.status = $2
          AND ppa.deleted_at IS NULL
          AND pr.deleted_at IS NULL
        ORDER BY ppa.assigned_at DESC`,
      [patientId, ASSIGNMENT_STATUS.ACTIVE]
    );
    return result.rows;
  }

  /**
   * Creates or reactivates the assignment between a professional and
   * a patient (medical linking flow, Part 5). The UNIQUE pair
   * constraint makes this an idempotent upsert.
   * @param {number} professionalId
   * @param {number} patientId
   * @returns {Promise<Object>}
   */
  async createOrReactivate(professionalId, patientId) {
    const result = await this.execute(
      `INSERT INTO patient_professional_assignments
         (patient_id, professional_id, status, assigned_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (patient_id, professional_id)
       DO UPDATE SET status = $3, assigned_at = NOW(),
                     deleted_at = NULL, updated_at = NOW()
       RETURNING *`,
      [patientId, professionalId, ASSIGNMENT_STATUS.ACTIVE]
    );
    return result.rows[0];
  }

  /**
   * Updates the status of an assignment owned by the professional.
   * @param {number} professionalId
   * @param {number} patientId
   * @param {string} status - ASSIGNMENT_STATUS value.
   * @returns {Promise<Object|null>}
   */
  async updateStatus(professionalId, patientId, status) {
    const result = await this.execute(
      `UPDATE patient_professional_assignments
          SET status = $3, updated_at = NOW()
        WHERE professional_id = $1 AND patient_id = $2 AND deleted_at IS NULL
        RETURNING *`,
      [professionalId, patientId, status]
    );
    return result.rows[0] || null;
  }
}

module.exports = {
  AssignmentRepository,
  assignmentRepository: new AssignmentRepository(),
};
