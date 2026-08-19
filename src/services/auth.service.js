import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Commerce } from "../models/Commerce.js";
import { CommerceType } from "../models/CommerceType.js";
import { ROLES } from "../utils/constants.js";
import { AppError } from "../utils/appError.js";
import { generateRandomToken } from "./token.service.js";
import { sendEmail } from "./email.service.js";
import { buildActivationEmail, buildResetPasswordEmail } from "./email.templates.js";

const SALT_ROUNDS = 10;

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function findByUserNameOrEmail(userNameOrEmail) {
  return User.findOne({
    $or: [{ userName: userNameOrEmail }, { email: String(userNameOrEmail).toLowerCase() }],
  });
}

export async function authenticate(userNameOrEmail, password) {
  const user = await findByUserNameOrEmail(userNameOrEmail);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Credenciales inválidas.", 401);
  }

  if (!user.isActive) {
    throw new AppError("Tu cuenta está inactiva. Revisa tu correo o contacta a un administrador.", 401);
  }

  return user;
}

export async function assertUserNameAndEmailAvailable({ userName, email }) {
  const existing = await User.findOne({ $or: [{ userName }, { email: email.toLowerCase() }] });

  if (existing) {
    throw new AppError("El nombre de usuario o el correo ya están en uso.", 409);
  }
}

async function issueActivationToken(user, activationUrlBuilder) {
  const { token, expiration } = generateRandomToken();
  user.activateToken = token;
  user.activateTokenExpiration = expiration;
  await user.save();

  sendEmail({
    to: user.email,
    subject: "Activa tu cuenta en AppCenar",
    html: buildActivationEmail(user.firstName || user.userName, activationUrlBuilder(token)),
  }).catch((err) => console.error("[auth] Error enviando correo de activación:", err.message));
}

export async function registerUser({ role, profileImage, activationUrlBuilder, ...data }) {
  const { firstName, lastName, userName, email, password, phone } = data;

  await assertUserNameAndEmailAvailable({ userName, email });

  const user = await User.create({
    firstName,
    lastName,
    userName,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    phone,
    profileImage,
    role,
    isActive: false,
    ...(role === ROLES.DELIVERY && { isAvailable: true }),
  });

  await issueActivationToken(user, activationUrlBuilder);

  return user;
}

export async function registerCommerce({ logo, activationUrlBuilder, ...data }) {
  const { userName, email, password, name, description, phone, openingTime, closingTime, commerceTypeId } = data;

  await assertUserNameAndEmailAvailable({ userName, email });

  const commerceType = await CommerceType.findById(commerceTypeId);

  if (!commerceType) {
    throw new AppError("El tipo de comercio indicado no existe.", 400);
  }

  const user = await User.create({
    firstName: name,
    userName,
    email: email.toLowerCase(),
    password: await hashPassword(password),
    phone,
    role: ROLES.COMMERCE,
    isActive: false,
  });

  const commerce = await Commerce.create({
    user: user._id,
    name,
    description: description || "",
    phone,
    openingTime,
    closingTime,
    commerceType: commerceType._id,
    logo,
  });

  await issueActivationToken(user, activationUrlBuilder);

  return { user, commerce };
}

export async function activateAccount(token) {
  const user = await User.findOne({ activateToken: token });

  if (!user) {
    throw new AppError("Token no encontrado.", 404);
  }

  if (user.activateTokenExpiration < new Date()) {
    throw new AppError("El token ha expirado. Solicita uno nuevo.", 400);
  }

  user.isActive = true;
  user.activateToken = null;
  user.activateTokenExpiration = null;
  await user.save();

  return user;
}

export async function requestPasswordReset(userNameOrEmail, resetUrlBuilder) {
  const user = await findByUserNameOrEmail(userNameOrEmail);

  if (!user) {
    return null;
  }

  const { token, expiration } = generateRandomToken();
  user.resetToken = token;
  user.resetTokenExpiration = expiration;
  await user.save();

  sendEmail({
    to: user.email,
    subject: "Restablece tu contraseña en AppCenar",
    html: buildResetPasswordEmail(user.firstName || user.userName, resetUrlBuilder(token)),
  }).catch((err) => console.error("[auth] Error enviando correo de recuperación:", err.message));

  return user;
}

export async function resetPassword(token, password) {
  const user = await User.findOne({ resetToken: token });

  if (!user) {
    throw new AppError("Token inválido.", 400);
  }

  if (user.resetTokenExpiration < new Date()) {
    throw new AppError("El token ha expirado. Solicita uno nuevo.", 400);
  }

  user.password = await hashPassword(password);
  user.resetToken = null;
  user.resetTokenExpiration = null;
  await user.save();

  return user;
}
