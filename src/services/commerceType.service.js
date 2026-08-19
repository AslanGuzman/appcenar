import { CommerceType } from "../models/CommerceType.js";
import { Commerce } from "../models/Commerce.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Favorite } from "../models/Favorite.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/appError.js";

export async function findCommerceTypeOrFail(id) {
  const commerceType = await CommerceType.findById(id);

  if (!commerceType) {
    throw new AppError("Tipo de comercio no encontrado.", 404);
  }

  return commerceType;
}

export async function assertNameIsAvailable(name, excludeId = null) {
  const existing = await CommerceType.findOne({ name });

  if (existing && String(existing._id) !== String(excludeId)) {
    throw new AppError("Ya existe un tipo de comercio con ese nombre.", 409);
  }
}

export async function withCommerceCounts(commerceTypes) {
  return Promise.all(
    commerceTypes.map(async (type) => ({
      ...(typeof type.toObject === "function" ? type.toObject() : type),
      commerceCount: await Commerce.countDocuments({ commerceType: type._id }),
    }))
  );
}

export async function deleteCommerceTypeCascade(id) {
  const commerceType = await findCommerceTypeOrFail(id);

  const commerces = await Commerce.find({ commerceType: commerceType._id }).select("_id user");
  const commerceIds = commerces.map((commerce) => commerce._id);
  const userIds = commerces.map((commerce) => commerce.user);

  await Promise.all([
    Product.deleteMany({ commerce: { $in: commerceIds } }),
    Category.deleteMany({ commerce: { $in: commerceIds } }),
    Order.deleteMany({ commerce: { $in: commerceIds } }),
    Favorite.deleteMany({ commerce: { $in: commerceIds } }),
  ]);

  await Commerce.deleteMany({ _id: { $in: commerceIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await commerceType.deleteOne();

  return commerceType;
}
