import { CommerceType } from "../models/CommerceType.js";
import { success } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";
import {
  findCommerceTypeOrFail,
  assertNameIsAvailable,
  withCommerceCounts,
  deleteCommerceTypeCascade,
} from "../services/commerceType.service.js";
import { AppError } from "../utils/appError.js";

export async function listCommerceTypes(req, res, next) {
  try {
    const { search } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, {
      defaultSortBy: "name",
      defaultSortDirection: "asc",
    });

    const filter = search ? { name: { $regex: search, $options: "i" } } : {};

    const [commerceTypes, total] = await Promise.all([
      CommerceType.find(filter).sort(sort).skip(skip).limit(pageSize),
      CommerceType.countDocuments(filter),
    ]);

    const items = await withCommerceCounts(commerceTypes);

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getCommerceTypeById(req, res, next) {
  try {
    return success(res, { data: await findCommerceTypeOrFail(req.params.id) });
  } catch (err) {
    return next(err);
  }
}

export async function createCommerceType(req, res, next) {
  try {
    const { name, description } = req.body;

    await assertNameIsAvailable(name);

    if (!req.file) {
      throw new AppError("El ícono del tipo de comercio es requerido.", 400);
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
    const commerceType = await findCommerceTypeOrFail(req.params.id);
    const { name, description } = req.body;

    if (name) {
      await assertNameIsAvailable(name, commerceType._id);
      commerceType.name = name;
    }

    if (description !== undefined) commerceType.description = description;
    if (req.file) commerceType.icon = `/uploads/${req.file.filename}`;

    await commerceType.save();

    return success(res, { message: "Tipo de comercio actualizado.", data: commerceType });
  } catch (err) {
    return next(err);
  }
}

export async function deleteCommerceType(req, res, next) {
  try {
    await deleteCommerceTypeCascade(req.params.id);

    return success(res, { message: "Tipo de comercio y toda la información asociada fue eliminada." });
  } catch (err) {
    return next(err);
  }
}
