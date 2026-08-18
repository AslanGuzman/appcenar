import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Commerce } from "../models/Commerce.js";
import { Order } from "../models/Order.js";
import { ROLES, ORDER_STATUS } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

const SALT_ROUNDS = 10;

async function listUsersByRole(req, res, next, role) {
  try {
    const { search, isActive } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query);

    const filter = { role };
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(pageSize),
      User.countDocuments(filter),
    ]);

    const items = await Promise.all(
      users.map(async (user) => {
        let orderCount = 0;
        if (role === ROLES.CLIENT) {
          orderCount = await Order.countDocuments({ client: user._id });
        } else if (role === ROLES.DELIVERY) {
          orderCount = await Order.countDocuments({ delivery: user._id, status: ORDER_STATUS.COMPLETED });
        }
        return { ...user.toSafeObject(), orderCount };
      })
    );

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export const getClients = (req, res, next) => listUsersByRole(req, res, next, ROLES.CLIENT);
export const getDeliveries = (req, res, next) => listUsersByRole(req, res, next, ROLES.DELIVERY);

export async function getCommerces(req, res, next) {
  try {
    const { search, isActive } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query);

    const userFilter = { role: ROLES.COMMERCE };
    if (isActive !== undefined) userFilter.isActive = isActive === "true";

    const users = await User.find(userFilter);
    const userIds = users.map((u) => u._id);

    const commerceFilter = { user: { $in: userIds } };
    if (search) commerceFilter.name = { $regex: search, $options: "i" };

    const [commerces, total] = await Promise.all([
      Commerce.find(commerceFilter).sort(sort).skip(skip).limit(pageSize).populate("user", "email isActive"),
      Commerce.countDocuments(commerceFilter),
    ]);

    const items = await Promise.all(
      commerces.map(async (commerce) => {
        const orderCount = await Order.countDocuments({ commerce: commerce._id });
        return { ...commerce.toObject(), orderCount };
      })
    );

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getAdministrators(req, res, next) {
  try {
    const { search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query);

    const filter = { role: ROLES.ADMIN };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const [admins, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(pageSize),
      User.countDocuments(filter),
    ]);

    const items = admins.map((a) => a.toSafeObject());

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function createAdministrator(req, res, next) {
  try {
    const { firstName, lastName, userName, email, password, phone } = req.body;

    const existing = await User.findOne({ $or: [{ userName }, { email: email.toLowerCase() }] });
    if (existing) {
      return fail(res, { statusCode: 409, message: "El nombre de usuario o el correo ya están en uso." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await User.create({
      firstName,
      lastName,
      userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: ROLES.ADMIN,
      isActive: true,
    });

    return success(res, { statusCode: 201, message: "Administrador creado.", data: admin.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function updateAdministrator(req, res, next) {
  try {
    const target = await User.findOne({ _id: req.params.id, role: ROLES.ADMIN });
    if (!target) {
      return fail(res, { statusCode: 404, message: "Administrador no encontrado." });
    }

    if (target.isDefaultAdmin) {
      return fail(res, { statusCode: 403, message: "El administrador por defecto no puede ser modificado." });
    }

    if (target._id.toString() === req.user.id) {
      return fail(res, { statusCode: 403, message: "No puedes editar tu propio usuario desde este módulo." });
    }

    const { firstName, lastName, userName, email, phone, password } = req.body;
    if (firstName) target.firstName = firstName;
    if (lastName) target.lastName = lastName;
    if (userName) target.userName = userName;
    if (email) target.email = email.toLowerCase();
    if (phone) target.phone = phone;
    if (password) target.password = await bcrypt.hash(password, SALT_ROUNDS);

    await target.save();
    return success(res, { message: "Administrador actualizado.", data: target.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const target = await User.findById(req.params.id);

    if (!target) {
      return fail(res, { statusCode: 404, message: "Usuario no encontrado." });
    }

    if (target.isDefaultAdmin) {
      return fail(res, { statusCode: 403, message: "El administrador por defecto no puede ser inactivado." });
    }

    if (target._id.toString() === req.user.id) {
      return fail(res, { statusCode: 403, message: "No puedes cambiar el estado de tu propio usuario." });
    }

    target.isActive = isActive;
    await target.save();

    return success(res, { message: `Usuario ${isActive ? "activado" : "inactivado"} correctamente.`, data: target.toSafeObject() });
  } catch (err) {
    return next(err);
  }
}
