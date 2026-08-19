import { CommerceType } from "../models/CommerceType.js";
import { Commerce } from "../models/Commerce.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Favorite } from "../models/Favorite.js";
import { User } from "../models/User.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

export async function getActiveCommerceTypes(req, res, next) {
  try {
    const { search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "name", defaultSortDirection: "asc" });

    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const [items, total] = await Promise.all([
      CommerceType.find(filter).sort(sort).skip(skip).limit(pageSize).select("name icon description"),
      CommerceType.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/commerce
export async function getCommercesByType(req, res, next) {
  try {
    const { commerceTypeId, search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "name", defaultSortDirection: "asc" });

    if (!commerceTypeId) {
      return fail(res, { statusCode: 400, message: "commerceTypeId es requerido." });
    }

    // Solo comercios cuyo usuario está activo
    const activeCommerceUsers = await User.find({ role: "Commerce", isActive: true }).select("_id");
    const activeUserIds = activeCommerceUsers.map((u) => u._id);

    const filter = {
      commerceType: commerceTypeId,
      user: { $in: activeUserIds },
    };
    if (search) filter.name = { $regex: search, $options: "i" };

    const [commerces, total] = await Promise.all([
      Commerce.find(filter).sort(sort).skip(skip).limit(pageSize),
      Commerce.countDocuments(filter),
    ]);

    let favoriteCommerceIds = [];
    if (req.user) {
      const favorites = await Favorite.find({ client: req.user.id }).select("commerce");
      favoriteCommerceIds = favorites.map((f) => f.commerce.toString());
    }

    const items = commerces.map((c) => ({
      ...c.toObject(),
      isFavorite: favoriteCommerceIds.includes(c._id.toString()),
    }));

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/commerce/:commerceId/catalog
export async function getCommerceCatalog(req, res, next) {
  try {
    const { commerceId } = req.params;

    const commerce = await Commerce.findById(commerceId).populate("user", "isActive");
    if (!commerce || !commerce.user?.isActive) {
      return fail(res, { statusCode: 404, message: "Comercio no encontrado." });
    }

    const categories = await Category.find({ commerce: commerceId }).sort({ name: 1 });
    const products = await Product.find({ commerce: commerceId, isActive: true });

    const catalog = categories.map((category) => ({
      category: { id: category._id, name: category.name, description: category.description },
      products: products.filter((p) => p.category.toString() === category._id.toString()),
    }));

    return success(res, {
      data: {
        commerce: { id: commerce._id, name: commerce.name, logo: commerce.logo },
        categories: catalog,
      },
    });
  } catch (err) {
    return next(err);
  }
}
