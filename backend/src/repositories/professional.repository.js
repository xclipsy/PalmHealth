/**
 * Repositorio de profesionales: gestiona todo el SQL de la tabla
 * professionals.
 *
 * Alcance del Módulo 4: creación durante el registro, verificación de
 * licencia única y consulta de perfil.
 */

const { BaseRepository } = require('./base.repository');

class ProfessionalRepository extends BaseRepository {
  constructor() {
    super('professionals');
  }

  /**
 * Verifica si un número de licencia médica ya está registrado.
 *
 * @param {string} licenseNumber
 * @returns {Promise<boolean>}
 */
  async licenseExists(licenseNumber) {
    const result = await this.execute(
      'SELECT 1 FROM professionals WHERE license_number = $1 LIMIT 1',
      [licenseNumber]
    );
    return result.rowCount > 0;
  }

/**
 * Inserta el perfil del profesional dentro de una transacción existente
 * (el registro crea users + professionals de forma atómica).
 *
 * @param {import('pg').PoolClient} client - Cliente de transacción.
 * @param {Object} data - Campos del perfil del profesional.
 * @returns {Promise<Object>} Registro creado.
 */
  async createWithClient(client, data) {
    const result = await client.query(
      `INSERT INTO professionals
         (user_id, first_name, last_name, license_number, specialty,
          phone, years_experience, clinic_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.userId,
        data.firstName,
        data.lastName,
        data.licenseNumber,
        data.specialty,
        data.phone,
        data.yearsExperience ?? null,
        data.clinicName || null,
      ]
    );
    return result.rows[0];
  }
/**
 * Busca el perfil del profesional asociado a una cuenta de usuario.
 *
 * @param {number} userId
 * @returns {Promise<Object|null>}
 */
  async findByUserId(userId) {
    const result = await this.execute(
      'SELECT * FROM professionals WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
 * Actualiza campos editables del perfil del profesional (Parte 5):
 * teléfono, clínica y experiencia.
 *
 * Nunca modifica el número de licencia médica.
 *
 * @param {number} id - professionals.id
 * @param {Object} data
 * @returns {Promise<Object|null>}
 */
  async updateProfile(id, data) {
    const result = await this.execute(
      `UPDATE professionals
          SET phone            = COALESCE($2, phone),
              specialty        = COALESCE($3, specialty),
              years_experience = COALESCE($4, years_experience),
              clinic_name      = COALESCE($5, clinic_name),
              updated_at       = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      [
        id,
        data.phone ?? null,
        data.specialty ?? null,
        data.yearsExperience ?? null,
        data.clinicName ?? null,
      ]
    );
    return result.rows[0] || null;
  }

 /**
 * Lista pacientes con asignación ACTIVA a un profesional, con búsqueda
 * opcional sin distinguir mayúsculas/minúsculas en nombre, correo y
 * teléfono (Parte 5).
 *
 * @param {number} professionalId
 * @param {Object} filters - { search, status (estado de asignación) }.
 * @param {Object} options - { limit, offset }.
 * @returns {Promise<{ rows: Array<Object>, total: number }>}
 */
  async findAssignedPatients(professionalId, filters, { limit, offset }) {
    const conditions = [
      'ppa.professional_id = $1',
      'ppa.deleted_at IS NULL',
      'p.deleted_at IS NULL',
    ];
    const params = [professionalId];

    params.push(filters.status || 'ACTIVE');
    conditions.push(`ppa.status = $${params.length}`);

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const n = params.length;
      conditions.push(
        `(p.first_name ILIKE $${n} OR p.last_name ILIKE $${n} OR u.email ILIKE $${n} OR p.phone ILIKE $${n})`
      );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const baseFrom = `
      FROM patient_professional_assignments ppa
      JOIN patients p ON p.id = ppa.patient_id
      JOIN users u    ON u.id = p.user_id
    `;

    const countResult = await this.execute(
      `SELECT COUNT(*)::int AS total ${baseFrom} ${where}`,
      params
    );

    const listResult = await this.execute(
      `SELECT p.id, p.first_name, p.last_name, p.birth_date, p.phone,
              p.gender, u.email, ppa.status AS assignment_status,
              ppa.assigned_at
         ${baseFrom} ${where}
        ORDER BY p.last_name ASC, p.first_name ASC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows: listResult.rows, total: countResult.rows[0].total };
  }
}

module.exports = {
  ProfessionalRepository,
  professionalRepository: new ProfessionalRepository(),
};
