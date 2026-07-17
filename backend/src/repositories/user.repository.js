/**
 * User repository — owns all SQL against the users table.
 *
 * The password_hash column is only returned by findByEmailWithPassword
 * (needed for login comparison); every other query excludes it so
 * hashes never travel further than the auth service.
 */

const { BaseRepository } = require('./base.repository');

/** Columns safe to expose outside the repository (no password_hash). */
const SAFE_COLUMNS = 'id, email, role, status, created_at, updated_at';

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Finds an active-or-not user by email including the password hash.
   * Used exclusively by the login flow for bcrypt comparison.
   * @param {string} email - Normalized (lowercased) email.
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
   * Checks whether an email is already registered (soft-deleted rows
   * still count — emails are never recycled).
   * @param {string} email - Normalized email.
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
   * Inserts a new user inside an existing transaction client.
   * @param {import('pg').PoolClient} client - Transaction client.
   * @param {{ email: string, passwordHash: string, role: string }} data
   * @returns {Promise<Object>} The created row (safe columns only).
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
   * Finds a user by id without the password hash.
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
