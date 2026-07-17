/**
 * Ownership authorization middlewares (Parts 3, 4 and 5).
 *
 * Runs after authenticateToken + authorizeRole. Resolves the caller's
 * role profile (patients/professionals row) and, for professionals,
 * verifies the ACTIVE assignment to the requested patient. Domain
 * modules (8 and 9) wire these into their routes.
 *
 * Rules enforced:
 * - A patient can only ever act on their own records.
 * - A professional can only act on patients actively assigned to them.
 */

const { patientRepository } = require('../repositories/patient.repository');
const { professionalRepository } = require('../repositories/professional.repository');
const { assignmentRepository } = require('../repositories/assignment.repository');
const { AuthorizationError, NotFoundError } = require('../errors/app.errors');

/**
 * Loads the caller's patient profile into req.patient.
 * Guarantees downstream handlers operate exclusively on the
 * authenticated patient's own identity — never on ids from the URL.
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
 * Loads the caller's professional profile into req.professional.
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
 * Ownership guard factory for professional routes that reference a
 * patient id in the URL (e.g. /api/professional/patient/:id). Rejects
 * with 403 when there is no ACTIVE assignment linking the caller to
 * that patient. Must run after attachProfessionalProfile.
 *
 * @param {string} [paramName='id'] - Route param holding the patient id.
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
      // 403 (not 404): the caller is authenticated but lacks rights
      // over this patient. No patient data is leaked either way.
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
