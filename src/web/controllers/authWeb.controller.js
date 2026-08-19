import { CommerceType } from "../../models/CommerceType.js";
import { ROLES } from "../../utils/constants.js";
import {
  authenticate,
  registerUser,
  registerCommerce as registerCommerceAccount,
  activateAccount,
  requestPasswordReset,
  resetPassword as resetUserPassword,
} from "../../services/auth.service.js";
import { getRoleHome } from "../middlewares/webAuth.middleware.js";
import { flashFormData, popFormData } from "../utils/formData.js";

const uploadedPath = (file) => (file ? `/uploads/${file.filename}` : null);
const activationUrl = (token) => `${process.env.APP_URL}/auth/activate/${token}`;
const resetUrl = (token) => `${process.env.APP_URL}/auth/reset-password?token=${token}`;

function redirectWithError(req, res, path, message) {
  flashFormData(req);
  req.flash("errors", message);
  return res.redirect(path);
}

export function showLogin(req, res) {
  res.render("auth/login", { title: "Iniciar sesión", layout: "auth", formData: popFormData(req) });
}

export async function login(req, res) {
  const { userNameOrEmail, password } = req.body;

  let user;
  try {
    user = await authenticate(userNameOrEmail, password);
  } catch (err) {
    return redirectWithError(req, res, "/auth/login", err.message);
  }

  req.session.user = {
    id: user._id.toString(),
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  };

  const returnTo = req.session.returnTo;
  delete req.session.returnTo;

  if (returnTo && user.role === ROLES.CLIENT) {
    return res.redirect(returnTo);
  }

  return res.redirect(getRoleHome(user.role));
}

export function logout(req, res) {
  req.session.destroy(() => res.redirect("/auth/login"));
}

export function showRegister(req, res) {
  res.render("auth/register-user", { title: "Crear cuenta", layout: "auth", formData: popFormData(req) });
}

export async function register(req, res) {
  try {
    await registerUser({
      ...req.body,
      profileImage: uploadedPath(req.file),
      activationUrlBuilder: activationUrl,
    });
  } catch (err) {
    return redirectWithError(req, res, "/auth/register", err.message);
  }

  req.flash("success", "Cuenta creada. Revisa tu correo para activarla antes de iniciar sesión.");
  return res.redirect("/auth/login");
}

export async function showRegisterCommerce(req, res) {
  const commerceTypes = await CommerceType.find().sort({ name: 1 }).lean();
  res.render("auth/register-commerce", {
    title: "Registrar comercio",
    layout: "auth",
    commerceTypes,
    formData: popFormData(req),
  });
}

export async function registerCommerce(req, res) {
  try {
    await registerCommerceAccount({
      ...req.body,
      logo: uploadedPath(req.file),
      activationUrlBuilder: activationUrl,
    });
  } catch (err) {
    return redirectWithError(req, res, "/auth/register-commerce", err.message);
  }

  req.flash("success", "Comercio registrado. Revisa tu correo para activar la cuenta.");
  return res.redirect("/auth/login");
}

export async function activateAccountFromLink(req, res) {
  try {
    await activateAccount(req.params.token);
  } catch {
    req.flash("errors", "El enlace de activación es inválido o ha expirado.");
    return res.redirect("/auth/login");
  }

  req.flash("success", "Cuenta activada correctamente. Ya puedes iniciar sesión.");
  return res.redirect("/auth/login");
}

export function showForgotPassword(req, res) {
  res.render("auth/forgot-password", { title: "Recuperar contraseña", layout: "auth", formData: popFormData(req) });
}

export async function forgotPassword(req, res) {
  await requestPasswordReset(req.body.userNameOrEmail, resetUrl);

  req.flash("success", "Si el usuario existe, te enviamos un correo con instrucciones.");
  return res.redirect("/auth/login");
}

export function showResetPassword(req, res) {
  const { token } = req.query;

  if (!token) {
    req.flash("errors", "Enlace inválido.");
    return res.redirect("/auth/login");
  }

  res.render("auth/reset-password", { title: "Restablecer contraseña", layout: "auth", token });
}

export async function resetPassword(req, res) {
  try {
    await resetUserPassword(req.body.token, req.body.password);
  } catch {
    req.flash("errors", "El enlace ha expirado. Solicita uno nuevo.");
    return res.redirect("/auth/forgot-password");
  }

  req.flash("success", "Contraseña actualizada. Ya puedes iniciar sesión.");
  return res.redirect("/auth/login");
}
