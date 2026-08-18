import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Commerce } from "../models/Commerce.js";
import { CommerceType } from "../models/CommerceType.js";
import { ROLES } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { generateAccessToken, generateRandomToken } from "../services/token.service.js";
import { sendEmail } from "../services/email.service.js";
import { buildActivationEmail, buildResetPasswordEmail } from "../services/email.templates.js";

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
  sendEmail({
    to: user.email,
    subject: "Activa tu cuenta en ApiCenar",
    html: buildActivationEmail(user.firstName || user.userName, activationUrl),
  }).catch((err) => console.error("[auth] Error enviando correo de activación:", err.message));
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
async function activateUserByToken(token) {
  const user = await User.findOne({ activateToken: token });

  if (!user) {
    return { ok: false, statusCode: 404, message: "Token no encontrado." };
  }

  if (user.activateTokenExpiration < new Date()) {
    return { ok: false, statusCode: 400, message: "El token ha expirado. Solicita uno nuevo." };
  }

  user.isActive = true;
  user.activateToken = null;
  user.activateTokenExpiration = null;
  await user.save();

  return { ok: true, statusCode: 200, message: "Cuenta activada correctamente. Ya puedes iniciar sesión." };
}

function renderConfirmEmailPage(res, { ok, message }) {
  res.status(ok ? 200 : 400).send(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${ok ? "Cuenta activada" : "No se pudo activar la cuenta"} · ApiCenar</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; background:#f5f5f5; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
          .card { background:#fff; padding:32px 40px; border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.08); text-align:center; max-width:420px; }
          h1 { font-size:20px; color:${ok ? "#16a34a" : "#dc2626"}; }
          p { color:#374151; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${ok ? "✅ Cuenta activada" : "⚠️ No se pudo activar"}</h1>
          <p>${message}</p>
        </div>
      </body>
    </html>
  `);
}

/**
 * GET /api/auth/confirm-email?token=...
 * Endpoint pensado para ser abierto directamente desde el enlace del correo
 * (los navegadores solo pueden seguir enlaces con GET). Reutiliza la misma
 * lógica que el endpoint POST documentado para la API.
 */
export async function confirmEmailFromLink(req, res) {
  const { token } = req.query;

  if (!token) {
    return renderConfirmEmailPage(res, { ok: false, message: "Falta el token de activación en el enlace." });
  }

  try {
    const result = await activateUserByToken(token);
    return renderConfirmEmailPage(res, result);
  } catch (err) {
    return renderConfirmEmailPage(res, { ok: false, message: "Ocurrió un error al activar la cuenta." });
  }
}

/**
 * POST /api/auth/confirm-email
 * Endpoint documentado para consumidores de la API (Postman, apps móviles, etc.)
 */
export async function confirmEmail(req, res, next) {
  try {
    const { token } = req.body;
    const result = await activateUserByToken(token);

    if (!result.ok) {
      return fail(res, { statusCode: result.statusCode, message: result.message });
    }

    return success(res, { statusCode: 200, message: result.message });
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
    sendEmail({
      to: user.email,
      subject: "Restablece tu contraseña en ApiCenar",
      html: buildResetPasswordEmail(user.firstName || user.userName, resetUrl),
    }).catch((err) => console.error("[auth] Error enviando correo de reset:", err.message));

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
