import bcrypt from "bcryptjs";
import { User } from "../../models/User.js";
import { Commerce } from "../../models/Commerce.js";
import { CommerceType } from "../../models/CommerceType.js";
import { Category } from "../../models/Category.js";
import { Product } from "../../models/Product.js";
import { Order } from "../../models/Order.js";
import { Favorite } from "../../models/Favorite.js";
import { Configuration } from "../../models/Configuration.js";
import { ROLES, ORDER_STATUS } from "../../utils/constants.js";
import { popFormData } from "../utils/formData.js";

const SALT_ROUNDS = 10;

// Rutas de listado por rol, usadas como destino por defecto al activar/inactivar
// un usuario (no dependemos del header Referrer, que Helmet bloquea por
// política de privacidad y por eso siempre terminábamos en el dashboard).
const LIST_PATH_BY_ROLE = {
  [ROLES.CLIENT]: "/admin/clients",
  [ROLES.DELIVERY]: "/admin/deliveries",
  [ROLES.COMMERCE]: "/admin/commerces",
  [ROLES.ADMIN]: "/admin/administrators",
};

/* ---------------------------- Dashboard ---------------------------- */

export async function dashboard(req, res) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    ordersToday,
    commercesActive,
    commercesInactive,
    clientsActive,
    clientsInactive,
    deliveriesActive,
    deliveriesInactive,
    totalProducts,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    User.countDocuments({ role: ROLES.COMMERCE, isActive: true }),
    User.countDocuments({ role: ROLES.COMMERCE, isActive: false }),
    User.countDocuments({ role: ROLES.CLIENT, isActive: true }),
    User.countDocuments({ role: ROLES.CLIENT, isActive: false }),
    User.countDocuments({ role: ROLES.DELIVERY, isActive: true }),
    User.countDocuments({ role: ROLES.DELIVERY, isActive: false }),
    Product.countDocuments(),
  ]);

  res.render("admin/dashboard", {
    title: "Dashboard",
    metrics: {
      totalOrders,
      ordersToday,
      commercesActive,
      commercesInactive,
      clientsActive,
      clientsInactive,
      deliveriesActive,
      deliveriesInactive,
      totalProducts,
    },
  });
}

/* ---------------------------- Clientes / Deliveries ---------------------------- */

async function renderUserList(req, res, { role, view, title }) {
  // .lean() -> objetos planos, así Handlebars puede leer sus propiedades
  // (los documentos de Mongoose las exponen vía getters del prototipo, y
  // Handlebars bloquea el acceso a propiedades heredadas por seguridad).
  const users = await User.find({ role }).sort({ createdAt: -1 }).lean();

  const items = await Promise.all(
    users.map(async (u) => {
      const orderCount =
        role === ROLES.CLIENT
          ? await Order.countDocuments({ client: u._id })
          : await Order.countDocuments({ delivery: u._id, status: ORDER_STATUS.COMPLETED });
      delete u.password;
      delete u.activateToken;
      delete u.resetToken;
      delete u.resetTokenExpiration;
      return { ...u, orderCount };
    })
  );

  res.render(view, { title, users: items });
}

export const listClients = (req, res) => renderUserList(req, res, { role: ROLES.CLIENT, view: "admin/clients", title: "Clientes" });
export const listDeliveries = (req, res) => renderUserList(req, res, { role: ROLES.DELIVERY, view: "admin/deliveries", title: "Deliveries" });

export async function listCommerces(req, res) {
  const users = await User.find({ role: ROLES.COMMERCE }).sort({ createdAt: -1 }).lean();
  const commerces = await Commerce.find({ user: { $in: users.map((u) => u._id) } }).populate("user").lean();

  const items = await Promise.all(
    commerces.map(async (c) => ({ ...c, orderCount: await Order.countDocuments({ commerce: c._id }) }))
  );

  res.render("admin/commerces", { title: "Comercios", commerces: items });
}

export async function toggleUserStatus(req, res) {
  const target = await User.findById(req.params.id);
  const redirectTo = req.body.redirectTo || (target ? LIST_PATH_BY_ROLE[target.role] : null) || "/admin/dashboard";

  if (!target) {
    req.flash("errors", "Usuario no encontrado.");
    return res.redirect(redirectTo);
  }

  if (target.isDefaultAdmin) {
    req.flash("errors", "El administrador por defecto no puede ser inactivado.");
    return res.redirect(redirectTo);
  }

  if (target._id.toString() === req.session.user.id) {
    req.flash("errors", "No puedes cambiar el estado de tu propio usuario.");
    return res.redirect(redirectTo);
  }

  target.isActive = !target.isActive;
  await target.save();

  req.flash("success", `Usuario ${target.isActive ? "activado" : "inactivado"} correctamente.`);
  return res.redirect(redirectTo);
}

/* ---------------------------- Configuración ---------------------------- */

export async function showConfiguration(req, res) {
  const configuration = await Configuration.findOne({ key: "ITBIS" }).lean();
  res.render("admin/configuration", {
    title: "Configuración",
    configuration: { ...configuration, ...popFormData(req) },
  });
}

export async function updateConfiguration(req, res) {
  const configuration = await Configuration.findOne({ key: "ITBIS" });
  if (!configuration) {
    req.flash("errors", "La configuración no existe.");
    return res.redirect("/admin/configuration");
  }

  configuration.value = String(req.body.value);
  await configuration.save();

  req.flash("success", `Configuración actualizada. El ITBIS actual es ${configuration.value}%.`);
  return res.redirect("/admin/configuration");
}

/* ---------------------------- Administradores ---------------------------- */

export async function listAdministrators(req, res) {
  const admins = await User.find({ role: ROLES.ADMIN }).sort({ createdAt: -1 }).lean();
  res.render("admin/administrators", { title: "Administradores", admins, currentUserId: req.session.user.id });
}

export function showNewAdministrator(req, res) {
  res.render("admin/administrator-form", {
    title: "Nuevo administrador",
    admin: popFormData(req),
    formAction: "/admin/administrators",
  });
}

export async function createAdministrator(req, res) {
  const { firstName, lastName, identificationCard, userName, email, password, phone } = req.body;

  const existing = await User.findOne({ $or: [{ userName }, { email: email.toLowerCase() }] });
  if (existing) {
    req.flash("errors", "El nombre de usuario o el correo ya están en uso.");
    return res.redirect("/admin/administrators/new");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await User.create({
    firstName,
    lastName,
    identificationCard,
    userName,
    email: email.toLowerCase(),
    password: hashedPassword,
    phone,
    role: ROLES.ADMIN,
    isActive: true,
  });

  req.flash("success", "Administrador creado correctamente.");
  return res.redirect("/admin/administrators");
}

export async function showEditAdministrator(req, res) {
  const admin = await User.findOne({ _id: req.params.id, role: ROLES.ADMIN }).lean();

  if (!admin) {
    req.flash("errors", "Administrador no encontrado.");
    return res.redirect("/admin/administrators");
  }

  if (admin.isDefaultAdmin || admin._id.toString() === req.session.user.id) {
    req.flash("errors", "Este administrador no puede ser editado.");
    return res.redirect("/admin/administrators");
  }

  res.render("admin/administrator-form", {
    title: "Editar administrador",
    admin: { ...admin, ...popFormData(req) },
    formAction: `/admin/administrators/${admin._id}`,
  });
}

export async function updateAdministrator(req, res) {
  const admin = await User.findOne({ _id: req.params.id, role: ROLES.ADMIN });

  if (!admin || admin.isDefaultAdmin || admin._id.toString() === req.session.user.id) {
    req.flash("errors", "Este administrador no puede ser editado.");
    return res.redirect("/admin/administrators");
  }

  const { firstName, lastName, identificationCard, userName, email, phone, password } = req.body;
  admin.firstName = firstName;
  admin.lastName = lastName;
  admin.identificationCard = identificationCard;
  admin.userName = userName;
  admin.email = email.toLowerCase();
  admin.phone = phone;
  if (password) admin.password = await bcrypt.hash(password, SALT_ROUNDS);

  await admin.save();
  req.flash("success", "Administrador actualizado correctamente.");
  return res.redirect("/admin/administrators");
}

export async function confirmToggleAdministrator(req, res) {
  const admin = await User.findOne({ _id: req.params.id, role: ROLES.ADMIN }).lean();
  if (!admin) {
    req.flash("errors", "Administrador no encontrado.");
    return res.redirect("/admin/administrators");
  }
  res.render("admin/administrator-toggle", { title: "Confirmar acción", admin });
}

/* ---------------------------- Tipos de comercio ---------------------------- */

export async function listCommerceTypes(req, res) {
  const types = await CommerceType.find().sort({ name: 1 }).lean();

  const items = await Promise.all(
    types.map(async (t) => ({ ...t, commerceCount: await Commerce.countDocuments({ commerceType: t._id }) }))
  );

  res.render("admin/commerce-types", { title: "Tipos de comercio", types: items });
}

export function showNewCommerceType(req, res) {
  res.render("admin/commerce-type-form", {
    title: "Nuevo tipo de comercio",
    commerceType: popFormData(req),
    formAction: "/admin/commerce-types",
  });
}

export async function createCommerceType(req, res) {
  const { name, description } = req.body;

  const existing = await CommerceType.findOne({ name });
  if (existing) {
    req.flash("errors", "Ya existe un tipo de comercio con ese nombre.");
    return res.redirect("/admin/commerce-types/new");
  }

  await CommerceType.create({ name, description, icon: `/uploads/${req.file.filename}` });
  req.flash("success", "Tipo de comercio creado correctamente.");
  return res.redirect("/admin/commerce-types");
}

export async function showEditCommerceType(req, res) {
  const commerceType = await CommerceType.findById(req.params.id).lean();
  if (!commerceType) {
    req.flash("errors", "Tipo de comercio no encontrado.");
    return res.redirect("/admin/commerce-types");
  }
  res.render("admin/commerce-type-form", {
    title: "Editar tipo de comercio",
    commerceType: { ...commerceType, ...popFormData(req) },
    formAction: `/admin/commerce-types/${commerceType._id}`,
  });
}

export async function updateCommerceType(req, res) {
  const commerceType = await CommerceType.findById(req.params.id);
  if (!commerceType) {
    req.flash("errors", "Tipo de comercio no encontrado.");
    return res.redirect("/admin/commerce-types");
  }

  commerceType.name = req.body.name;
  commerceType.description = req.body.description;
  if (req.file) commerceType.icon = `/uploads/${req.file.filename}`;
  await commerceType.save();

  req.flash("success", "Tipo de comercio actualizado correctamente.");
  return res.redirect("/admin/commerce-types");
}

export async function confirmDeleteCommerceType(req, res) {
  const commerceType = await CommerceType.findById(req.params.id).lean();
  if (!commerceType) {
    req.flash("errors", "Tipo de comercio no encontrado.");
    return res.redirect("/admin/commerce-types");
  }
  res.render("admin/commerce-type-delete", { title: "Eliminar tipo de comercio", commerceType });
}

export async function deleteCommerceType(req, res) {
  const commerceType = await CommerceType.findById(req.params.id);
  if (!commerceType) {
    req.flash("errors", "Tipo de comercio no encontrado.");
    return res.redirect("/admin/commerce-types");
  }

  const commerces = await Commerce.find({ commerceType: commerceType._id });
  const commerceIds = commerces.map((c) => c._id);
  const userIds = commerces.map((c) => c.user);

  await Product.deleteMany({ commerce: { $in: commerceIds } });
  await Category.deleteMany({ commerce: { $in: commerceIds } });
  await Order.deleteMany({ commerce: { $in: commerceIds } });
  await Favorite.deleteMany({ commerce: { $in: commerceIds } });
  await Commerce.deleteMany({ _id: { $in: commerceIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await commerceType.deleteOne();

  req.flash("success", "Tipo de comercio y toda la información asociada fue eliminada.");
  return res.redirect("/admin/commerce-types");
}
