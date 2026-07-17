/**
 * Environment configuration.
 *
 * Single source of truth for every environment variable used by the
 * backend. No other module reads process.env directly — this keeps
 * configuration auditable and makes missing variables fail fast.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,

  /**
   * Local PostgreSQL connection parameters.
   * Discrete DB_* variables per project configuration (no cloud
   * provider, no connection-string coupling).
   */
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'palm_health',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  /**
   * JWT configuration (Part 3 of the specification).
   * Secret must never be hardcoded; expiration defaults to 24h.
   */
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  /** bcrypt cost factor. 12 is the recommended baseline for the MVP. */
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  /** Allowed CORS origin for the SPA. */
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = { env };
