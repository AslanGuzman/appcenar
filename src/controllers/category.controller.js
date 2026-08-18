import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Commerce } from "../models/Commerce.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

async function getCommerceIdFromUser(userId) {
  const commerce = await Commerce.findOne({ user: userId });
  return commerce ? commerce._id : null;
}

export async function listMyCategories(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const { search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "name", defaultSortDirection: "asc" });

    const filter = { commerce: commerceId };
    if (search) filter.name = { $regex: search, $options: "i" };

    const [categories, total] = await Promise.all([
      Category.find(filter).sort(sort).skip(skip).limit(pageSize),
      Category.countDocuments(filter),
    ]);

    const items = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return { ...category.toObject(), productCount };
      })
    );

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const category = await Category.findOne({ _id: req.params.id, commerce: commerceId });
    if (!category) {
      return fail(res, { statusCode: 404, message: "Categoría no encontrada." });
    }
    return success(res, { data: category });
  } catch (err) {
    return next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const { name, description } = req.body;

    const existing = await Category.findOne({ commerce: commerceId, name });
    if (existing) {
      return fail(res, { statusCode: 409, message: "Ya tienes una categoría con ese nombre." });
    }

    const category = await Category.create({ commerce: commerceId, name, description });
    return success(res, { statusCode: 201, message: "Categoría creada.", data: category });
  } catch (err) {
    return next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const category = await Category.findOne({ _id: req.params.id, commerce: commerceId });
    if (!category) {
      return fail(res, { statusCode: 404, message: "Categoría no encontrada." });
    }

    const { name, description } = req.body;
    if (name) category.name = name;
    if (description) category.description = description;
    await category.save();

    return success(res, { message: "Categoría actualizada.", data: category });
  } catch (err) {
    return next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const category = await Category.findOne({ _id: req.params.id, commerce: commerceId });
    if (!category) {
      return fail(res, { statusCode: 404, message: "Categoría no encontrada." });
    }

    await Product.deleteMany({ category: category._id });
    await category.deleteOne();

    return success(res, { message: "Categoría eliminada." });
  } catch (err) {
    return next(err);
  }
}
