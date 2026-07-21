/**
 * Agregador de rutas API.
 *
 * Monta cada router de dominio bajo la ruta base /api (ver app.js).
 *
 * Los routers de dominio son marcadores hasta que sus módulos sean
 * implementados:
 *   - Módulo 4: auth.routes.js
 *   - Módulo 8: patient.routes.js
 *   - Módulo 9: professional.routes.js
 */

const express = require('express');

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const professionalRoutes = require('./professional.routes');
const healthController = require('../controllers/health.controller');

const router = express.Router();
/**
 * Endpoint de comprobación de estado (health check): informa el estado
 * de la API y la base de datos.
 *
 * Útil para verificaciones de disponibilidad y pruebas rápidas.
 */
router.get('/health', healthController.getHealth);

router.use('/auth', authRoutes);
router.use('/patient', patientRoutes);
router.use('/professional', professionalRoutes);

module.exports = router;
