/**
 * Repositorio de pacientes: gestiona todo el SQL de la tabla patients.
 *
 * Alcance del Módulo 4: creación durante el registro y consulta de perfil.
 */

const { BaseRepository } = require('./base.repository');

class PatientRepository extends BaseRepository {
  constructor() {
    super('patients');
  }

 /**
 * Inserta el perfil del paciente dentro de una transacción existente
 * (el registro crea users + patients de forma atómica).
 *
 * @param {import('pg').PoolClient} client - Cliente de transacción.
 * @param {Object} data - Campos del perfil del paciente.
 * @returns {Promise<Object>} Registro creado.
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
 * Busca el perfil del paciente asociado a una cuenta de usuario.
 *
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
 * Actualiza campos editables del perfil del paciente (Parte 4):
 * teléfono, foto y contacto de emergencia.
 *
 * Nunca modifica email, nombre ni fecha de nacimiento.
 *
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
 * Busca un perfil de paciente por correo de la cuenta (flujo de
 * vinculación médica: el profesional vincula al paciente usando su
 * correo registrado).
 *
 * @param {string} email - Correo normalizado (en minúsculas).
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
 * Perfil completo con el correo de la cuenta (vista del paciente por
 * parte del profesional y página de perfil del propio paciente).
 *
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
