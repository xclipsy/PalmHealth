/**
 * Repositorio de usuarios: gestiona todo el SQL de la tabla users.
 *
 * La columna password_hash solo se devuelve mediante findByEmailWithPassword
 * (necesaria para comparar credenciales durante el inicio de sesión);
 * cualquier otra consulta la excluye para evitar que los hashes lleguen
 * más allá del servicio de autenticación.
 */

const { BaseRepository } = require('./base.repository');

/**
 * Columnas seguras para exponer fuera del repositorio (sin password_hash).
 */
const SAFE_COLUMNS = 'id, email, role, status, created_at, updated_at';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }
/**
 * Busca un usuario activo o no por correo incluyendo el hash de contraseña.
 *
 * Se usa exclusivamente en el flujo de inicio de sesión para la
 * comparación con bcrypt.
 *
 * @param {string} email - Correo normalizado (en minúsculas).
 * @returns {Promise<Object|null>}
 */
  async findByEmailWithPassword(email) {
    const result = await this.execute(
      `SELECT id, email, password_hash, role, status
         FROM users
        WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
 * Verifica si un correo ya está registrado (los registros eliminados
 * lógicamente también cuentan; los correos nunca se reutilizan).
 *
 * @param {string} email - Correo normalizado.
 * @returns {Promise<boolean>}
 */
  async emailExists(email) {
    const result = await this.execute(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rowCount > 0;
  }
/**
 * Inserta un nuevo usuario dentro de un cliente de transacción existente.
 *
 * @param {import('pg').PoolClient} client - Cliente de transacción.
 * @param {{ email: string, passwordHash: string, role: string }} data
 * @returns {Promise<Object>} La fila creada (solo columnas seguras).
 */
  async createWithClient(client, { email, passwordHash, role }) {
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING ${SAFE_COLUMNS}`,
      [email, passwordHash, role]
    );
    return result.rows[0];
  }

  /**
 * Busca un usuario por ID sin incluir el hash de contraseña.
 *
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
  async findSafeById(id) {
    const result = await this.execute(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = { UserRepository, userRepository: new UserRepository() };
