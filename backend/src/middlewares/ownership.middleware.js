/**
 * Middlewares de autorización por propiedad (Partes 3, 4 y 5).
 *
 * Se ejecutan después de authenticateToken + authorizeRole.
 * Verifican la relación entre usuario y recursos según su rol.
 *
 * Reglas:
 * - El paciente solo accede a sus propios registros.
 * - El profesional solo accede a pacientes asignados activamente.
 */
const { patientRepository } = require('../repositories/patient.repository');
const { professionalRepository } = require('../repositories/professional.repository');
const { assignmentRepository } = require('../repositories/assignment.repository');
const { AuthorizationError, NotFoundError } = require('../errors/app.errors');

/**
 * Carga el perfil del paciente autenticado en req.patient.
 *
 * Garantiza que los handlers usen la identidad del usuario autenticado
 * y no IDs enviados desde la URL.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const attachPatientProfile = async (req, res, next) => {
  try {
    const patient = await patientRepository.findByUserId(req.user.id);
    if (!patient) {
      throw new NotFoundError('El perfil de paciente no existe.');
    }
    req.patient = patient;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Carga el perfil del profesional autenticado en req.professional.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const attachProfessionalProfile = async (req, res, next) => {
  try {
    const professional = await professionalRepository.findByUserId(req.user.id);
    if (!professional) {
      throw new NotFoundError('El perfil de profesional no existe.');
    }
    req.professional = professional;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Guarda de propiedad para rutas de profesionales con ID de paciente.
 *
 * Rechaza con 403 si no existe una asignación ACTIVA con el paciente.
 * Debe ejecutarse después de attachProfessionalProfile.
 *
 * @param {string} [paramName='id'] - Parámetro con el ID del paciente.
 * @returns {import('express').RequestHandler}
 */
const verifyPatientAssignment = (paramName = 'id') => async (req, res, next) => {
  try {
    const patientId = Number(req.params[paramName]);

    if (!Number.isInteger(patientId) || patientId <= 0) {
      throw new NotFoundError('El paciente solicitado no existe.');
    }

    const isAssigned = await assignmentRepository.isProfessionalAssignedToPatient(
      req.professional.id,
      patientId
    );

    if (!isAssigned) {
      // 403 (no 404): usuario autenticado sin permisos sobre el paciente.
    // No se expone información del paciente.
      throw new AuthorizationError('No tienes permisos para acceder a este paciente.');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  attachPatientProfile,
  attachProfessionalProfile,
  verifyPatientAssignment,
};
