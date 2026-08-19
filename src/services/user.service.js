import { Commerce } from "../models/Commerce.js";
import { AppError } from "../utils/appError.js";

export async function getCommerceByUser(userId) {
  const commerce = await Commerce.findOne({ user: userId });

  if (!commerce) {
    throw new AppError("No se encontró el comercio asociado a tu cuenta.", 404);
  }

  return commerce;
}

export async function getCommerceIdByUser(userId) {
  const commerce = await getCommerceByUser(userId);
  return commerce._id;
}
