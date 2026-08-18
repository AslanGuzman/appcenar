import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Commerce } from "../models/Commerce.js";
import { CommerceType } from "../models/CommerceType.js";
import { ROLES } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { generateAccessToken, generateRandomToken } from "../services/token.service.js";
import { sendEmail, buildActivationEmail, buildResetPasswordEmail } from "../services/email.service.js";

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { userNameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail.toLowerCase() }],
    });

    if (!user) {
      return fail(res, { statusCode: 401, message: "Credenciales inválidas." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return fail(res, { statusCode: 401, message: "Credenciales inválidas." });
    }

    if (!user.isActive) {
      return fail(res, { statusCode: 401, message: "Tu cuenta está inactiva. Revisa tu correo o contacta a un administrador." });
    }

    const { token, expiresAt } = generateAccessToken(user);

    return success(res, {
      statusCode: 200,
      message: "Autenticación exitosa.",
      data: {
        token,
        expiresAt,
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function assertUniqueUser({ userName, email }) {
  const existing = await User.findOne({ $or: [{ userName }, { email: email.toLowerCase() }] });
  if (existing) {
    throw new AppError("El nombre de usuario o el correo ya están en uso.", 409);
  }
}

async function createAndActivateFlow(user) {
  const { token, expiration } = generateRandomToken();
  user.activateToken = token;
  user.activateTokenExpiration = expiration;
  await user.save();

  const activationUrl = `${process.env.APP_URL}/api/auth/confirm-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Activa tu cuenta en ApiCenar",
    html: buildActivationEmail(user.firstName || user.userName, activationUrl),
  });
}

/**
 * POST /api/auth/register-client
 */
export async function registerClient(req, res, next) {
  try {
    const { firstName, lastName, userName, email, password, phone } = req.body;

    await assertUniqueUser({ userName, email });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      profileImage: req.file ? `/uploads/${req.file.filename}` : null,
      role: ROLES.CLIENT,
      isActive: false,
    });

    await createAndActivateFlow(user);

    return success(res, {
      statusCode: 201,
      message: "Cliente registrado correctamente. Revisa tu correo para activar la cuenta.",
      data: user.toSafeObject(),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/register-delivery
 */
export async function registerDelivery(req, res, next) {
  try {
    const { firstName, lastName, userName, email, password, phone } = req.body;

    await assertUniqueUser({ userName, email });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      profileImage: req.file ? `/uploads/${req.file.filename}` : null,
      role: ROLES.DELIVERY,
      isActive: false,
      isAvailable: true,
    });

    await createAndActivateFlow(user);

    return success(res, {
      statusCode: 201,
      message: "Repartidor registrado correctamente. Revisa tu correo para activar la cuenta.",
      data: user.toSafeObject(),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/register-commerce
 */
export async function registerCommerce(req, res, next) {
  try {
    const {
      userName,
      email,
      password,
      name,
      description,
      phone,
      openingTime,
      closingTime,
      commerceTypeId,
    } = req.body;

    await assertUniqueUser({ userName, email });

    const commerceType = await CommerceType.findById(commerceTypeId);
    if (!commerceType) {
      throw new AppError("El tipo de comercio indicado no existe.", 400);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName: name,
      lastName: "",
      userName,
      email: email.toLowerCase(),
      password: hashedPassword,
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
      logo: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await createAndActivateFlow(user);

    return success(res, {
      statusCode: 201,
      message: "Comercio registrado correctamente. Revisa tu correo para activar la cuenta.",
      data: { user: user.toSafeObject(), commerce },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/confirm-email
 */
export async function confirmEmail(req, res, next) {
  try {
    const { token } = req.body;

    const user = await User.findOne({ activateToken: token });

    if (!user) {
      return fail(res, { statusCode: 404, message: "Token no encontrado." });
    }

    if (user.activateTokenExpiration < new Date()) {
      return fail(res, { statusCode: 400, message: "El token ha expirado. Solicita uno nuevo." });
    }

    user.isActive = true;
    user.activateToken = null;
    user.activateTokenExpiration = null;
    await user.save();

    return success(res, { statusCode: 200, message: "Cuenta activada correctamente. Ya puedes iniciar sesión." });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res, next) {
  try {
    const { userNameOrEmail } = req.body;

    const user = await User.findOne({
      $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail.toLowerCase() }],
    });

    // Por seguridad, siempre respondemos 200 aunque el usuario no exista
    if (!user) {
      return success(res, { statusCode: 200, message: "Si el usuario existe, se ha enviado un correo con instrucciones." });
    }

    const { token, expiration } = generateRandomToken();
    user.resetToken = token;
    user.resetTokenExpiration = expiration;
    await user.save();

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Restablece tu contraseña en ApiCenar",
      html: buildResetPasswordEmail(user.firstName || user.userName, resetUrl),
    });

    return success(res, { statusCode: 200, message: "Si el usuario existe, se ha enviado un correo con instrucciones." });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({ resetToken: token });

    if (!user) {
      return fail(res, { statusCode: 400, message: "Token inválido." });
    }

    if (user.resetTokenExpiration < new Date()) {
      return fail(res, { statusCode: 400, message: "El token ha expirado. Solicita uno nuevo." });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    user.resetToken = null;
    user.resetTokenExpiration = null;
    await user.save();

    return success(res, { statusCode: 200, message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return next(err);
  }
}
