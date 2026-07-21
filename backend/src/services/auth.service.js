// Servicio de Autenticación: lógica de negocio para registro, login, perfil, cambio de contraseña y eliminación de cuenta.
const { withTransaction } = require('../config/database.config');
const { userRepository } = require('../repositories/user.repository');
const { patientRepository } = require('../repositories/patient.repository');
const { professionalRepository } = require('../repositories/professional.repository');
const { assignmentRepository } = require('../repositories/assignment.repository');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { signToken } = require('../utils/jwt.util');
const { USER_ROLES, USER_STATUS } = require('../constants/app.constants');
const {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} = require('../errors/app.errors');

const INVALID_CREDENTIALS_MESSAGE = 'Correo electrónico o contraseña incorrectos.';

// Estructura el objeto público de usuario para respuestas del cliente.
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

// Registra un nuevo paciente en una transacción atómica.
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

// Registra un nuevo profesional en una transacción atómica.
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

// Autentica a un usuario con correo y contraseña.
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
    throw new AuthenticationError(INVALID_CREDENTIALS_MESSAGE);
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token, user: buildPublicUser({ ...user, password_hash: undefined }, profile) };
};

// Obtiene el perfil público del usuario autenticado.
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

// Cambia la contraseña del usuario autenticado.
const changePassword = async (userId, currentPassword, newPassword) => {
  const safeUser = await userRepository.findSafeById(userId);
  if (!safeUser) {
    throw new NotFoundError('Usuario no encontrado.');
  }
  const user = await userRepository.findByEmailWithPassword(safeUser.email);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }

  const matches = await comparePassword(currentPassword, user.password_hash);
  if (!matches) {
    throw new ValidationError('La contraseña actual es incorrecta.');
  }

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newHash);
};

// Elimina la cuenta del usuario autenticado (con validación de pacientes vinculados para médicos).
const deleteAccount = async (userId) => {
  const user = await userRepository.findSafeById(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado.');
  }

  if (user.role === USER_ROLES.PROFESSIONAL) {
    const prof = await professionalRepository.findByUserId(userId);
    if (prof) {
      const assigned = await professionalRepository.findAssignedPatients(
        prof.id,
        { status: 'ACTIVE' },
        { limit: 1, offset: 0 }
      );
      if (assigned.total > 0) {
        throw new BusinessRuleError(
          'No puedes eliminar tu cuenta mientras tengas pacientes asignados. Debes desvincular a todos tus pacientes antes de continuar.'
        );
      }
    }
  } else if (user.role === USER_ROLES.PATIENT) {
    const patient = await patientRepository.findByUserId(userId);
    if (patient) {
      await patientRepository.softDelete(patient.id);
      await assignmentRepository.softDeleteAllByPatientId(patient.id);
    }
  }

  await userRepository.softDelete(userId);
};

module.exports = {
  registerPatient,
  registerProfessional,
  login,
  getProfile,
  changePassword,
  deleteAccount,
};
