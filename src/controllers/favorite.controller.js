import { Favorite } from "../models/Favorite.js";
import { Commerce } from "../models/Commerce.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

export async function listMyFavorites(req, res, next) {
  try {
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "createdAt", defaultSortDirection: "desc" });
    const filter = { client: req.user.id };

    const [favorites, total] = await Promise.all([
      Favorite.find(filter).sort(sort).skip(skip).limit(pageSize).populate("commerce", "name logo"),
      Favorite.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items: favorites, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function addFavorite(req, res, next) {
  try {
    const { commerceId } = req.body;

    const commerce = await Commerce.findById(commerceId).populate("user", "isActive");
    if (!commerce || !commerce.user?.isActive) {
      return fail(res, { statusCode: 404, message: "El comercio no existe o no está activo." });
    }

    const existing = await Favorite.findOne({ client: req.user.id, commerce: commerceId });
    if (existing) {
      return fail(res, { statusCode: 409, message: "Este comercio ya está en tus favoritos." });
    }

    const favorite = await Favorite.create({ client: req.user.id, commerce: commerceId });
    return success(res, { statusCode: 201, message: "Comercio agregado a favoritos.", data: favorite });
  } catch (err) {
    return next(err);
  }
}

export async function removeFavorite(req, res, next) {
  try {
    const favorite = await Favorite.findOneAndDelete({ client: req.user.id, commerce: req.params.commerceId });
    if (!favorite) {
      return fail(res, { statusCode: 404, message: "Favorito no encontrado." });
    }
    return success(res, { message: "Comercio removido de favoritos." });
  } catch (err) {
    return next(err);
  }
}
