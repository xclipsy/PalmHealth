// Repositorio de Usuarios: gestiona las consultas SQL de la tabla 'users'.
const { BaseRepository } = require('./base.repository');

const SAFE_COLUMNS = 'id, email, role, status, created_at, updated_at';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  // Busca un usuario por correo electrónico incluyendo el hash de la contraseña (solo para inicio de sesión).
  async findByEmailWithPassword(email) {
    const result = await this.execute(
      `SELECT id, email, password_hash, role, status
         FROM users
        WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    return result.rows[0] || null;
  }

  // Verifica si el correo ya existe en el sistema.
  async emailExists(email) {
    const result = await this.execute(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rowCount > 0;
  }

  // Crea un usuario dentro de una transacción activa.
  async createWithClient(client, { email, passwordHash, role }) {
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING ${SAFE_COLUMNS}`,
      [email, passwordHash, role]
    );
    return result.rows[0];
  }

  // Busca un usuario por ID excluyendo el hash de la contraseña.
  async findSafeById(id) {
    const result = await this.execute(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Actualiza la contraseña del usuario.
  async updatePassword(userId, passwordHash) {
    await this.execute(
      `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [userId, passwordHash]
    );
  }

  // Elimina lógicamente la cuenta del usuario.
  async softDelete(userId) {
    await this.execute(
      `UPDATE users SET status = 'INACTIVE', deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}

module.exports = { UserRepository, userRepository: new UserRepository() };
