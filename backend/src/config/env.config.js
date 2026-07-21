// Configuración centralizada de variables de entorno.
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'palm_health',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' || false,
  },
  jwtSecret: process.env.JWT_SECRET || 'palm_health_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = { env };
