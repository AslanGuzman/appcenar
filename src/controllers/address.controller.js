import { Address } from "../models/Address.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";

export async function listMyAddresses(req, res, next) {
  try {
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "createdAt", defaultSortDirection: "desc" });
    const filter = { client: req.user.id };

    const [items, total] = await Promise.all([
      Address.find(filter).sort(sort).skip(skip).limit(pageSize),
      Address.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getAddressById(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.user.id });
    if (!address) {
      return fail(res, { statusCode: 404, message: "Dirección no encontrada." });
    }
    return success(res, { data: address });
  } catch (err) {
    return next(err);
  }
}

export async function createAddress(req, res, next) {
  try {
    const address = await Address.create({ ...req.body, client: req.user.id });
    return success(res, { statusCode: 201, message: "Dirección creada.", data: address });
  } catch (err) {
    return next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.user.id });
    if (!address) {
      return fail(res, { statusCode: 404, message: "Dirección no encontrada." });
    }

    Object.assign(address, req.body);
    await address.save();

    return success(res, { message: "Dirección actualizada.", data: address });
  } catch (err) {
    return next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.user.id });
    if (!address) {
      return fail(res, { statusCode: 404, message: "Dirección no encontrada." });
    }
    await address.deleteOne();
    return success(res, { message: "Dirección eliminada." });
  } catch (err) {
    return next(err);
  }
}
