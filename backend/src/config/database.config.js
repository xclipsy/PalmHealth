/**
 * PostgreSQL connection pool configuration (placeholder).
 *
 * Module 3 (Database) will flesh out pool sizing and health checks.
 * All repositories must obtain their client from this module — no
 * repository ever creates its own connection.
 *
 * ORM-free by specification: raw SQL through the `pg` driver only.
 */

const { Pool } = require('pg');
const { env } = require('./env.config');

/**
 * Lazily created singleton pool. Created on first query so the server
 * can boot (and serve the SPA) even before the database is configured.
 */
let pool = null;

/**
 * Returns the shared connection pool, creating it on first use.
 * @returns {import('pg').Pool}
 */
const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      // Local PostgreSQL installation — no TLS required.
      ssl: false,
    });
  }
  return pool;
};

/**
 * Executes a parameterized SQL query against the pool.
 * Always use parameter placeholders ($1, $2, ...) — never interpolate
 * values into SQL strings (SQL injection prevention).
 *
 * @param {string} text - SQL text with $n placeholders.
 * @param {Array<*>} [params] - Query parameters.
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => getPool().query(text, params);

/**
 * Runs a callback inside a database transaction. Commits on success,
 * rolls back on any error, and always releases the client. Used by
 * flows that must be atomic (e.g. registration inserts into users
 * plus a role profile table).
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>} The callback's resolved value.
 */
const withTransaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Lightweight connectivity probe used by the health endpoint.
 * @returns {Promise<boolean>} true when the database answers.
 */
const isDatabaseHealthy = async () => {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

/**
 * Closes the pool during graceful shutdown so no connection leaks.
 * Safe to call when the pool was never created.
 * @returns {Promise<void>}
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { getPool, query, withTransaction, isDatabaseHealthy, closePool };
