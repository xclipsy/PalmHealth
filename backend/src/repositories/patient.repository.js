/**
 * Patient repository — owns all SQL against the patients table.
 * Module 4 scope: creation during registration and profile lookup.
 */

const { BaseRepository } = require('./base.repository');

class PatientRepository extends BaseRepository {
  constructor() {
    super('patients');
  }

  /**
   * Inserts the patient profile inside an existing transaction client
   * (registration creates users + patients atomically).
   * @param {import('pg').PoolClient} client - Transaction client.
   * @param {Object} data - Patient profile fields.
   * @returns {Promise<Object>} The created row.
   */
  async createWithClient(client, data) {
    const result = await client.query(
      `INSERT INTO patients
         (user_id, first_name, last_name, birth_date, phone, gender,
          emergency_contact_name, emergency_contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.userId,
        data.firstName,
        data.lastName,
        data.birthDate,
        data.phone,
        data.gender || null,
        data.emergencyContactName || null,
        data.emergencyContactPhone || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Finds the patient profile linked to a user account.
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  async findByUserId(userId) {
    const result = await this.execute(
      'SELECT * FROM patients WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Updates the patient-editable profile fields (Part 4: phone, photo,
   * emergency contact — never email, name or birth date).
   * @param {number} id - patients.id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async updateProfile(id, data) {
    const result = await this.execute(
      `UPDATE patients
          SET phone                   = COALESCE($2, phone),
              gender                  = COALESCE($3, gender),
              emergency_contact_name  = COALESCE($4, emergency_contact_name),
              emergency_contact_phone = COALESCE($5, emergency_contact_phone),
              updated_at              = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        id,
        data.phone ?? null,
        data.gender ?? null,
        data.emergencyContactName ?? null,
        data.emergencyContactPhone ?? null,
      ]
    );
    return result.rows[0] || null;
  }

  /**
   * Finds a patient profile by account email (medical linking flow:
   * a professional links a patient using their registered email).
   * @param {string} email - Normalized (lowercased) email.
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const result = await this.execute(
      `SELECT p.*, u.email
         FROM patients p
         JOIN users u ON u.id = p.user_id
        WHERE u.email = $1 AND p.deleted_at IS NULL AND u.deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Full profile with the account email (professional's patient view
   * and the patient's own profile page).
   * @param {number} id - patients.id
   * @returns {Promise<Object|null>}
   */
  async findWithEmail(id) {
    const result = await this.execute(
      `SELECT p.*, u.email
         FROM patients p
         JOIN users u ON u.id = p.user_id
        WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = { PatientRepository, patientRepository: new PatientRepository() };
