// Configuración del pool de conexiones PostgreSQL (driver 'pg').
const { Pool } = require('pg');
const { env } = require('./env.config');

let pool = null;

// Obtiene la instancia singleton del pool de conexiones.
const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.name,
      user: env.db.user,
      password: env.db.password,
      ssl: false,
    });
  }
  return pool;
};

// Ejecuta una consulta SQL parametrizada.
const query = (text, params) => getPool().query(text, params);

// Ejecuta un callback dentro de una transacción SQL (BEGIN/COMMIT/ROLLBACK).
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

// Verifica el estado de conexión con la base de datos.
const isDatabaseHealthy = async () => {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

// Cierra el pool de conexiones al apagar el servidor.
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = { getPool, query, withTransaction, isDatabaseHealthy, closePool };
