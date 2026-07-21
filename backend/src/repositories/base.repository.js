/**
 * Repositorio base (Parte 6 de la especificación).
 *
 * Base común para todos los repositorios. Gestiona acceso al pool,
 * consultas parametrizadas y borrado lógico (deleted_at IS NULL).
 *
 * Reglas:
 * - El SQL solo vive en repositorios.
 * - Toda consulta usa parámetros ($1, $2, ...).
 * - Los repositorios no conocen HTTP.
 */
const { query } = require('../config/database.config');

class BaseRepository {
 /**
 * @param {string} tableName - Tabla PostgreSQL gestionada por el repositorio.
 */
  constructor(tableName) {
    if (!tableName) {
      throw new Error('BaseRepository requires a table name.');
    }
    this.tableName = tableName;
  }

  /**
 * Ejecuta una consulta SQL parametrizada.
 *
 * @param {string} text - SQL con marcadores $n.
 * @param {Array<*>} [params] - Valores de parámetros.
 * @returns {Promise<import('pg').QueryResult>}
 */
  async execute(text, params = []) {
    return query(text, params);
  }

 /**
 * Busca un registro activo (no eliminado) por clave primaria.
 *
 * @param {number|string} id - Valor de la clave primaria.
 * @returns {Promise<Object|null>} Registro o null si no existe.
 */
  async findById(id) {
    const result = await this.execute(
      `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
 * Cuenta registros activos con filtro opcional.
 *
 * @param {string} [whereClause=''] - Condiciones adicionales.
 * @param {Array<*>} [params] - Parámetros del filtro.
 * @returns {Promise<number>} Total de registros.
 */
  async count(whereClause = '', params = []) {
    const result = await this.execute(
      `SELECT COUNT(*)::int AS total FROM ${this.tableName} WHERE deleted_at IS NULL ${whereClause}`,
      params
    );
    return result.rows[0].total;
  }

  /**
 * Realiza borrado lógico por clave primaria.
 *
 * Los datos clínicos nunca se eliminan físicamente (Parte 7).
 *
 * @param {number|string} id - Valor de la clave primaria.
 * @returns {Promise<boolean>} True si se marcó como eliminado.
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
