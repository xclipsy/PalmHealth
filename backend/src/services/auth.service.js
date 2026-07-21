/**
 * Servicio de autenticación (Parte 3 de la especificación).
 *
 * Toda la lógica de negocio de autenticación vive aquí: registro
 * (creación atómica de usuario + perfil según rol), inicio de sesión
 * (comparación con bcrypt + verificación del estado de la cuenta) y
 * obtención del perfil. Los controladores se mantienen ligeros;
 * los repositorios son responsables del SQL.
 *
 * Reglas de seguridad aplicadas:
 * - Las contraseñas solo existen como hashes bcrypt almacenados.
 * - Los errores de inicio de sesión nunca revelan si el correo o la
 *   contraseña fueron incorrectos (protección contra enumeración de usuarios).
 * - Solo las cuentas ACTIVE pueden autenticarse.
 * - El payload del JWT contiene únicamente { id, role }.
 */

const { withTransaction } = require('../config/database.config');
const { userRepository } = require('../repositories/user.repository');
const { patientRepository } = require('../repositories/patient.repository');
const { professionalRepository } = require('../repositories/professional.repository');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { signToken } = require('../utils/jwt.util');
const { USER_ROLES, USER_STATUS } = require('../constants/app.constants');
const {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} = require('../errors/app.errors');

/**
 * Mensaje uniforme de fallo de inicio de sesión: nunca revela qué
 * campo fue incorrecto.
 */
const INVALID_CREDENTIALS_MESSAGE = 'Correo electrónico o contraseña incorrectos.';

/**
 * Construye el objeto público de usuario que se devuelve al frontend.
 *
 * Nunca incluye password_hash ni columnas internas.
 *
 * @param {Object} user - Fila de users (columnas seguras).
 * @param {Object} profile - Fila de patients o professionals.
 * @returns {Object}
 */
const buildPublicUser = (user, profile) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  status: user.status,
  profile: {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    photoUrl: profile.photo_url || null,
    ...(user.role === USER_ROLES.PATIENT
      ? {
          birthDate: profile.birth_date,
          gender: profile.gender || null,
          emergencyContactName: profile.emergency_contact_name || null,
          emergencyContactPhone: profile.emergency_contact_phone || null,
        }
      : {
          licenseNumber: profile.license_number,
          specialty: profile.specialty,
          yearsExperience: profile.years_experience ?? null,
          clinicName: profile.clinic_name || null,
        }),
  },
});

/**
 * Registra una nueva cuenta de paciente. Crea la fila de users y el
 * perfil de patients de forma atómica: ambos se crean o ninguno existe.
 *
 * @param {Object} data - Datos de registro validados.
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {ConflictError} Cuando el correo ya está registrado.
 */
const registerPatient = async (data) => {
  const email = data.email.toLowerCase().trim();

  if (await userRepository.emailExists(email)) {
    throw new ConflictError('Este correo electrónico ya está registrado.');
  }

  const passwordHash = await hashPassword(data.password);

  const { user, profile } = await withTransaction(async (client) => {
    const createdUser = await userRepository.createWithClient(client, {
      email,
      passwordHash,
      role: USER_ROLES.PATIENT,
    });
    const createdProfile = await patientRepository.createWithClient(client, {
      userId: createdUser.id,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      phone: data.phone,
      gender: data.gender,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
    });
    return { user: createdUser, profile: createdProfile };
  });

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: buildPublicUser(user, profile) };
};
/**
 * Registra una nueva cuenta de profesional. Utiliza el mismo patrón
 * atómico que registerPatient, además de validar la unicidad de la
 * licencia médica.
 *
 * @param {Object} data - Datos de registro validados.
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {ConflictError} Cuando el correo o la licencia ya existen.
 */
const registerProfessional = async (data) => {
  const email = data.email.toLowerCase().trim();

  if (await userRepository.emailExists(email)) {
    throw new ConflictError('Este correo electrónico ya está registrado.');
  }
  if (await professionalRepository.licenseExists(data.licenseNumber.trim())) {
    throw new ConflictError('Este número de licencia médica ya está registrado.');
  }

  const passwordHash = await hashPassword(data.password);

  const { user, profile } = await withTransaction(async (client) => {
    const createdUser = await userRepository.createWithClient(client, {
      email,
      passwordHash,
      role: USER_ROLES.PROFESSIONAL,
    });
    const createdProfile = await professionalRepository.createWithClient(client, {
      userId: createdUser.id,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseNumber: data.licenseNumber.trim(),
      specialty: data.specialty,
      phone: data.phone,
      yearsExperience: data.yearsExperience,
      clinicName: data.clinicName,
    });
    return { user: createdUser, profile: createdProfile };
  });

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: buildPublicUser(user, profile) };
};
/**
 * Autentica un usuario mediante correo y contraseña.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {AuthenticationError} Cuando el correo no existe, la contraseña
 *   es incorrecta o la cuenta no está ACTIVE. Siempre utiliza el mismo
 *   mensaje genérico para fallos de credenciales.
 */
const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await userRepository.findByEmailWithPassword(normalizedEmail);

  if (!user) {
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await comparePassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AuthenticationError(
      'Tu cuenta no está activa. Contacta al soporte de Palm Health.'
    );
  }

  const profile =
    user.role === USER_ROLES.PATIENT
      ? await patientRepository.findByUserId(user.id)
      : await professionalRepository.findByUserId(user.id);

  if (!profile) {
// La cuenta existe, pero falta su perfil asociado al rol.
// Es un problema de integridad de datos; se trata como un fallo de
// autenticación sin revelar detalles.
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: buildPublicUser({ ...user, password_hash: undefined }, profile) };
};

/**
 * Devuelve el perfil público del usuario autenticado.
 *
 * @param {number} userId - Obtenido del JWT verificado.
 * @returns {Promise<Object>}
 * @throws {NotFoundError} Cuando la cuenta o el perfil ya no existen.
 */
const getProfile = async (userId) => {
  const user = await userRepository.findSafeById(userId);
  if (!user) {
    throw new NotFoundError('La cuenta no existe o fue eliminada.');
  }

  const profile =
    user.role === USER_ROLES.PATIENT
      ? await patientRepository.findByUserId(user.id)
      : await professionalRepository.findByUserId(user.id);

  if (!profile) {
    throw new NotFoundError('El perfil de usuario no existe.');
  }

  return buildPublicUser(user, profile);
};

module.exports = { registerPatient, registerProfessional, login, getProfile };
