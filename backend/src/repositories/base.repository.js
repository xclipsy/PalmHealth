/**
 * Base repository (Part 6 of the specification).
 *
 * Shared foundation for every entity repository. Encapsulates the pg
 * pool access, parameterized query execution and the soft-delete
 * convention (deleted_at IS NULL) so entity repositories never repeat
 * this plumbing.
 *
 * Rules:
 * - SQL lives only in repositories — never in services or controllers.
 * - Every query is parameterized ($1, $2, ...) — no string interpolation.
 * - Repositories know nothing about HTTP (no req/res/status codes).
 */

const { query } = require('../config/database.config');

class BaseRepository {
  /**
   * @param {string} tableName - The PostgreSQL table this repository owns.
   */
  constructor(tableName) {
    if (!tableName) {
      throw new Error('BaseRepository requires a table name.');
    }
    this.tableName = tableName;
  }

  /**
   * Executes a parameterized SQL query.
   * @param {string} text - SQL with $n placeholders.
   * @param {Array<*>} [params] - Parameter values.
   * @returns {Promise<import('pg').QueryResult>}
   */
  async execute(text, params = []) {
    return query(text, params);
  }

  /**
   * Finds one active (non soft-deleted) row by primary key.
   * @param {number|string} id - Primary key value.
   * @returns {Promise<Object|null>} The row or null when not found.
   */
  async findById(id) {
    const result = await this.execute(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Counts active rows, optionally filtered by a WHERE fragment.
   * @param {string} [whereClause=''] - Extra conditions (e.g. 'AND status = $1').
   * @param {Array<*>} [params] - Parameters for the WHERE fragment.
   * @returns {Promise<number>} Total matching rows.
   */
  async count(whereClause = '', params = []) {
    const result = await this.execute(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName} WHERE deleted_at IS NULL ${whereClause}`,
      params
    );
    return result.rows[0].total;
  }

  /**
   * Soft-deletes a row by primary key. Clinical data is never
   * physically removed (Part 7 of the specification).
   * @param {number|string} id - Primary key value.
   * @returns {Promise<boolean>} True when a row was marked as deleted.
   */
  async softDelete(id) {
    const result = await this.execute(
      `UPDATE ${this.tableName}
         SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = { BaseRepository };
