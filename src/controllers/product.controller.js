import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { success, fail } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";
import { getCommerceIdByUser } from "../services/user.service.js";

export async function listMyProducts(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const { search, categoryId } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "name", defaultSortDirection: "asc" });

    const filter = { commerce: commerceId };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (categoryId) filter.category = categoryId;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(pageSize).populate("category", "name"),
      Product.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const product = await Product.findOne({ _id: req.params.id, commerce: commerceId }).populate("category", "name");
    if (!product) {
      return fail(res, { statusCode: 404, message: "Producto no encontrado." });
    }
    return success(res, { data: product });
  } catch (err) {
    return next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const { name, description, price, categoryId } = req.body;

    const category = await Category.findOne({ _id: categoryId, commerce: commerceId });
    if (!category) {
      throw new AppError("La categoría indicada no pertenece a tu comercio.", 400);
    }

    if (!req.file) {
      return fail(res, { statusCode: 400, message: "La imagen del producto es requerida." });
    }

    const product = await Product.create({
      commerce: commerceId,
      category: categoryId,
      name,
      description,
      price: Number(price),
      image: `/uploads/${req.file.filename}`,
    });

    return success(res, { statusCode: 201, message: "Producto creado.", data: product });
  } catch (err) {
    return next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const product = await Product.findOne({ _id: req.params.id, commerce: commerceId });
    if (!product) {
      return fail(res, { statusCode: 404, message: "Producto no encontrado." });
    }

    const { name, description, price, categoryId } = req.body;

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, commerce: commerceId });
      if (!category) {
        throw new AppError("La categoría indicada no pertenece a tu comercio.", 400);
      }
      product.category = categoryId;
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (req.file) product.image = `/uploads/${req.file.filename}`;

    await product.save();
    return success(res, { message: "Producto actualizado.", data: product });
  } catch (err) {
    return next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const product = await Product.findOne({ _id: req.params.id, commerce: commerceId });
    if (!product) {
      return fail(res, { statusCode: 404, message: "Producto no encontrado." });
    }
    await product.deleteOne();
    return success(res, { message: "Producto eliminado." });
  } catch (err) {
    return next(err);
  }
}
