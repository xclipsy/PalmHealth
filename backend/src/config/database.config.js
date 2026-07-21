/**
 * Pool de conexiones a PostgreSQL.
 *
 * Centraliza las conexiones para todos los repositorios.
 * Utiliza SQL nativo mediante `pg` (sin ORM).
 */

const { Pool } = require('pg');
const { env } = require('./env.config');

/**
 * Pool de conexiones singleton, creado bajo demanda.
 *
 * Se inicializa en la primera consulta para permitir que el servidor
 * inicie incluso si la base de datos aún no está configurada.
 */
let pool = null;

/**
 * Obtiene el pool de conexiones compartido.
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
     // Instalación local de PostgreSQL: no requiere TLS.
      ssl: false,
    });
  }
  return pool;
};

/**
 * Ejecuta consultas SQL parametrizadas usando el pool.
 *
 * Usa siempre placeholders ($1, $2, ...) para evitar inyección SQL.
 *
 * @param {string} text - Consulta SQL con parámetros.
 * @param {Array<*>} [params] - Valores de la consulta.
 * @returns {Promise<import('pg').QueryResult>}
 */
 */
const query = (text, params) => getPool().query(text, params);

/**
 * Ejecuta una operación dentro de una transacción.
 *
 * Confirma los cambios si es exitosa, revierte errores y libera
 * siempre la conexión. Usado para procesos atómicos.
 *
 * @template T
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>} Resultado de la operación.
 */
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
 * Verifica la conexión con la base de datos para el endpoint de salud.
 * @returns {Promise<boolean>} true si la base de datos responde.
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
 * Cierra el pool durante el apagado controlado.
 * Evita fugas de conexiones y funciona aunque no se haya creado.
 * @returns {Promise<void>}
 */
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { getPool, query, withTransaction, isDatabaseHealthy, closePool };
