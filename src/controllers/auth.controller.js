import { ROLES } from "../utils/constants.js";
import { success } from "../utils/apiResponse.js";
import { generateAccessToken } from "../services/token.service.js";
import {
  authenticate,
  registerUser,
  registerCommerce as registerCommerceAccount,
  activateAccount,
  requestPasswordReset,
  resetPassword as resetUserPassword,
} from "../services/auth.service.js";

const uploadedPath = (file) => (file ? `/uploads/${file.filename}` : null);
const activationUrl = (token) => `${process.env.APP_URL}/api/auth/confirm-email?token=${token}`;
const resetUrl = (token) => `${process.env.APP_URL}/auth/reset-password?token=${token}`;

export async function login(req, res, next) {
  try {
    const { userNameOrEmail, password } = req.body;
    const user = await authenticate(userNameOrEmail, password);
    const { token, expiresAt } = generateAccessToken(user);

    return success(res, {
      message: "Autenticación exitosa.",
      data: {
        token,
        expiresAt,
        user: { id: user._id, userName: user.userName, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    return next(err);
  }
}

function registerWithRole(role, successMessage) {
  return async (req, res, next) => {
    try {
      const user = await registerUser({
        ...req.body,
        role,
        profileImage: uploadedPath(req.file),
        activationUrlBuilder: activationUrl,
      });

      return success(res, { statusCode: 201, message: successMessage, data: user.toSafeObject() });
    } catch (err) {
      return next(err);
    }
  };
}

export const registerClient = registerWithRole(
  ROLES.CLIENT,
  "Cliente registrado correctamente. Revisa tu correo para activar la cuenta."
);

export const registerDelivery = registerWithRole(
  ROLES.DELIVERY,
  "Repartidor registrado correctamente. Revisa tu correo para activar la cuenta."
);

export async function registerCommerce(req, res, next) {
  try {
    const { user, commerce } = await registerCommerceAccount({
      ...req.body,
      logo: uploadedPath(req.file),
      activationUrlBuilder: activationUrl,
    });

    return success(res, {
      statusCode: 201,
      message: "Comercio registrado correctamente. Revisa tu correo para activar la cuenta.",
      data: { user: user.toSafeObject(), commerce },
    });
  } catch (err) {
    return next(err);
  }
}

export async function confirmEmail(req, res, next) {
  try {
    await activateAccount(req.body.token);
    return success(res, { message: "Cuenta activada correctamente. Ya puedes iniciar sesión." });
  } catch (err) {
    return next(err);
  }
}

export async function confirmEmailFromLink(req, res) {
  const render = (ok, message) =>
    res.status(ok ? 200 : 400).render("auth/confirm-result", {
      layout: "auth",
      title: ok ? "Cuenta activada" : "No se pudo activar",
      ok,
      message,
    });

  if (!req.query.token) {
    return render(false, "Falta el token de activación en el enlace.");
  }

  try {
    await activateAccount(req.query.token);
    return render(true, "Tu cuenta fue activada correctamente. Ya puedes iniciar sesión.");
  } catch (err) {
    return render(false, err.isOperational ? err.message : "Ocurrió un error al activar la cuenta.");
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await requestPasswordReset(req.body.userNameOrEmail, resetUrl);
    return success(res, { message: "Si el usuario existe, se ha enviado un correo con instrucciones." });
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    await resetUserPassword(req.body.token, req.body.password);
    return success(res, { message: "Contraseña actualizada correctamente." });
  } catch (err) {
    return next(err);
  }
}
