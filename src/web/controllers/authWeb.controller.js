import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import { Commerce } from "../../models/Commerce.js";
import { CommerceType } from "../../models/CommerceType.js";
import { ROLES } from "../../utils/constants.js";
import { generateRandomToken } from "../../services/token.service.js";
import { sendEmail } from "../../services/email.service.js";
import { buildActivationEmail, buildResetPasswordEmail } from "../../services/email.templates.js";
import { getRoleHome } from "../middlewares/webAuth.middleware.js";
import { flashFormData, popFormData } from "../utils/formData.js";

const SALT_ROUNDS = 10;

export function showLogin(req, res) {
  res.render("auth/login", { title: "Iniciar sesión", layout: "auth", formData: popFormData(req) });
}

export async function login(req, res) {
  const { userNameOrEmail, password } = req.body;

  const user = await User.findOne({
    $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail.toLowerCase() }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    flashFormData(req);
    req.flash("errors", "Usuario o contraseña incorrectos.");
    return res.redirect("/auth/login");
  }

  if (!user.isActive) {
    flashFormData(req);
    req.flash("errors", "Tu cuenta está inactiva. Revisa tu correo o contacta a un administrador.");
    return res.redirect("/auth/login");
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

async function sendActivationEmail(user) {
  const { token, expiration } = generateRandomToken();
  user.activateToken = token;
  user.activateTokenExpiration = expiration;
  await user.save();

  const activationUrl = `${process.env.APP_URL}/auth/activate/${token}`;

  sendEmail({
    to: user.email,
    subject: "Activa tu cuenta en AppCenar",
    html: buildActivationEmail(user.firstName || user.userName, activationUrl),
  }).catch((err) => console.error("[auth] Error enviando correo de activación:", err.message));
}

async function isUserNameOrEmailTaken({ userName, email }) {
  const existing = await User.findOne({ $or: [{ userName }, { email: email.toLowerCase() }] });
  return Boolean(existing);
}

export async function register(req, res) {
  const { firstName, lastName, userName, email, password, phone, role } = req.body;

  if (await isUserNameOrEmailTaken({ userName, email })) {
    flashFormData(req);
    req.flash("errors", "El nombre de usuario o el correo ya están en uso.");
    return res.redirect("/auth/register");
  }

  const user = await User.create({
    firstName,
    lastName,
    userName,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, SALT_ROUNDS),
    phone,
    profileImage: req.file ? `/uploads/${req.file.filename}` : null,
    role,
    isActive: false,
    isAvailable: role === ROLES.DELIVERY ? true : undefined,
  });

  await sendActivationEmail(user);

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
  const { userName, email, password, name, description, phone, openingTime, closingTime, commerceTypeId } = req.body;

  if (await isUserNameOrEmailTaken({ userName, email })) {
    flashFormData(req);
    req.flash("errors", "El nombre de usuario o el correo ya están en uso.");
    return res.redirect("/auth/register-commerce");
  }

  const commerceType = await CommerceType.findById(commerceTypeId);
  if (!commerceType) {
    flashFormData(req);
    req.flash("errors", "El tipo de comercio seleccionado no existe.");
    return res.redirect("/auth/register-commerce");
  }

  const user = await User.create({
    firstName: name,
    userName,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, SALT_ROUNDS),
    phone,
    role: ROLES.COMMERCE,
    isActive: false,
  });

  await Commerce.create({
    user: user._id,
    name,
    description: description || "",
    phone,
    openingTime,
    closingTime,
    commerceType: commerceType._id,
    logo: req.file ? `/uploads/${req.file.filename}` : null,
  });

  await sendActivationEmail(user);

  req.flash("success", "Comercio registrado. Revisa tu correo para activar la cuenta.");
  return res.redirect("/auth/login");
}

export async function activateAccount(req, res) {
  const user = await User.findOne({ activateToken: req.params.token });

  if (!user || user.activateTokenExpiration < new Date()) {
    req.flash("errors", "El enlace de activación es inválido o ha expirado.");
    return res.redirect("/auth/login");
  }

  user.isActive = true;
  user.activateToken = null;
  user.activateTokenExpiration = null;
  await user.save();

  req.flash("success", "Cuenta activada correctamente. Ya puedes iniciar sesión.");
  return res.redirect("/auth/login");
}

export function showForgotPassword(req, res) {
  res.render("auth/forgot-password", { title: "Recuperar contraseña", layout: "auth", formData: popFormData(req) });
}

export async function forgotPassword(req, res) {
  const { userNameOrEmail } = req.body;

  const user = await User.findOne({
    $or: [{ userName: userNameOrEmail }, { email: userNameOrEmail.toLowerCase() }],
  });

  if (user) {
    const { token, expiration } = generateRandomToken();
    user.resetToken = token;
    user.resetTokenExpiration = expiration;
    await user.save();

    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    sendEmail({
      to: user.email,
      subject: "Restablece tu contraseña en AppCenar",
      html: buildResetPasswordEmail(user.firstName || user.userName, resetUrl),
    }).catch((err) => console.error("[auth] Error enviando correo de reset:", err.message));
  }

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
  const { token, password } = req.body;

  const user = await User.findOne({ resetToken: token });

  if (!user || user.resetTokenExpiration < new Date()) {
    req.flash("errors", "El enlace ha expirado. Solicita uno nuevo.");
    return res.redirect("/auth/forgot-password");
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  user.resetToken = null;
  user.resetTokenExpiration = null;
  await user.save();

  req.flash("success", "Contraseña actualizada. Ya puedes iniciar sesión.");
  return res.redirect("/auth/login");
}
