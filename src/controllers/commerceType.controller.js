import { CommerceType } from "../models/CommerceType.js";
import { Commerce } from "../models/Commerce.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Favorite } from "../models/Favorite.js";
import { User } from "../models/User.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

export async function listCommerceTypes(req, res, next) {
  try {
    const { search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "name", defaultSortDirection: "asc" });

    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const [items, total] = await Promise.all([
      CommerceType.find(filter).sort(sort).skip(skip).limit(pageSize),
      CommerceType.countDocuments(filter),
    ]);

    // cantidad de comercios por tipo
    const withCounts = await Promise.all(
      items.map(async (type) => {
        const commerceCount = await Commerce.countDocuments({ commerceType: type._id });
        return { ...type.toObject(), commerceCount };
      })
    );

    return success(res, { data: buildPaginatedResponse({ items: withCounts, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getCommerceTypeById(req, res, next) {
  try {
    const commerceType = await CommerceType.findById(req.params.id);
    if (!commerceType) {
      return fail(res, { statusCode: 404, message: "Tipo de comercio no encontrado." });
    }
    return success(res, { data: commerceType });
  } catch (err) {
    return next(err);
  }
}

export async function createCommerceType(req, res, next) {
  try {
    const { name, description } = req.body;

    const existing = await CommerceType.findOne({ name });
    if (existing) {
      return fail(res, { statusCode: 409, message: "Ya existe un tipo de comercio con ese nombre." });
    }

    if (!req.file) {
      return fail(res, { statusCode: 400, message: "El ícono del tipo de comercio es requerido." });
    }

    const commerceType = await CommerceType.create({
      name,
      description: description || "",
      icon: `/uploads/${req.file.filename}`,
    });

    return success(res, { statusCode: 201, message: "Tipo de comercio creado.", data: commerceType });
  } catch (err) {
    return next(err);
  }
}

export async function updateCommerceType(req, res, next) {
  try {
    const commerceType = await CommerceType.findById(req.params.id);
    if (!commerceType) {
      return fail(res, { statusCode: 404, message: "Tipo de comercio no encontrado." });
    }

    const { name, description } = req.body;
    if (name) commerceType.name = name;
    if (description !== undefined) commerceType.description = description;
    if (req.file) commerceType.icon = `/uploads/${req.file.filename}`;

    await commerceType.save();
    return success(res, { message: "Tipo de comercio actualizado.", data: commerceType });
  } catch (err) {
    return next(err);
  }
}

/**
 * Hard delete en cascada: elimina el tipo de comercio, sus comercios,
 * usuarios de esos comercios, categorías, productos, pedidos y favoritos asociados.
 */
export async function deleteCommerceType(req, res, next) {
  try {
    const commerceType = await CommerceType.findById(req.params.id);
    if (!commerceType) {
      return fail(res, { statusCode: 404, message: "Tipo de comercio no encontrado." });
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

    return success(res, { message: "Tipo de comercio y toda la información asociada fue eliminada." });
  } catch (err) {
    return next(err);
  }
}
