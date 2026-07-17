/**
 * API route aggregator.
 *
 * Mounts every domain router under the /api base path (see app.js).
 * Domain routers are placeholders until their modules are implemented:
 *   - Module 4: auth.routes.js
 *   - Module 8: patient.routes.js
 *   - Module 9: professional.routes.js
 */

const express = require('express');

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const professionalRoutes = require('./professional.routes');
const healthController = require('../controllers/health.controller');

const router = express.Router();

/**
 * Health check endpoint — reports API and database status.
 * Useful for uptime probes and smoke tests.
 */
router.get('/health', healthController.getHealth);

router.use('/auth', authRoutes);
router.use('/patient', patientRoutes);
router.use('/professional', professionalRoutes);

module.exports = router;
