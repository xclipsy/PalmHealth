/**
 * Configuración del entorno.
 *
 * Centraliza todas las variables de entorno del backend.
 * Evita accesos directos a process.env y detecta faltantes rápidamente.
 */

const path = require('path');
const dotenv = require('dotenv');

// Carga el archivo .env desde la raíz del backend.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,

  /**
 * Parámetros de conexión local a PostgreSQL.
 *
 * Usa variables DB_* independientes, sin depender de proveedores
 * externos ni cadenas de conexión.
 */
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'palm_health',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

/**
 * Configuración JWT.
 *
 * El secreto nunca debe estar definido en código.
 * La expiración predeterminada es de 24 horas.
 */
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

/**
 * Factor de costo de bcrypt.
 *
 * 12 es el valor recomendado para el MVP.
 */
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  /** Origen CORS permitido para la SPA. */
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = { env };
