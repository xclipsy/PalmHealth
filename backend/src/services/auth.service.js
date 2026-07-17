/**
 * Authentication service (Part 3 of the specification).
 *
 * All authentication business logic lives here: registration (atomic
 * user + role profile creation), login (bcrypt comparison + account
 * status check) and profile retrieval. Controllers stay thin;
 * repositories own the SQL.
 *
 * Security rules enforced:
 * - Passwords only exist as bcrypt hashes at rest.
 * - Login errors never reveal whether the email or the password was
 *   wrong (anti user-enumeration).
 * - Only ACTIVE accounts can authenticate.
 * - JWT payload carries only { id, role }.
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

/** Uniform login failure message — never reveals which field failed. */
const INVALID_CREDENTIALS_MESSAGE = 'Correo electrónico o contraseña incorrectos.';

/**
 * Shapes the public user object returned to the frontend.
 * Never includes password_hash or internal columns.
 * @param {Object} user - users row (safe columns).
 * @param {Object} profile - patients or professionals row.
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
 * Registers a new patient account. Creates the users row and the
 * patients profile atomically — either both exist or neither does.
 * @param {Object} data - Validated registration payload.
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {ConflictError} When the email is already registered.
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
 * Registers a new professional account. Same atomic pattern as
 * registerPatient, plus medical license uniqueness validation.
 * @param {Object} data - Validated registration payload.
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {ConflictError} When the email or license already exists.
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
 * Authenticates a user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: Object }>}
 * @throws {AuthenticationError} On unknown email, wrong password or
 *   non-ACTIVE account — always with the same generic message for
 *   credential failures.
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
    // Account exists but its role profile is missing — data integrity
    // issue; treat as authentication failure without leaking details.
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: buildPublicUser({ ...user, password_hash: undefined }, profile) };
};

/**
 * Returns the authenticated user's public profile.
 * @param {number} userId - From the verified JWT.
 * @returns {Promise<Object>}
 * @throws {NotFoundError} When the account or profile no longer exists.
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
