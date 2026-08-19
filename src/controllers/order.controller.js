import { Order } from "../models/Order.js";
import { ORDER_STATUS } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";
import { getCommerceIdByUser } from "../services/user.service.js";
import {
  createOrder as createOrderForClient,
  assignDelivery as assignDeliveryToOrder,
  completeOrder as completeAssignedOrder,
  hideAddressWhenCompleted,
} from "../services/order.service.js";

const ORDER_LIST_DEFAULTS = { defaultSortBy: "createdAt", defaultSortDirection: "desc" };

async function listOrders(req, filter) {
  const { page, pageSize, skip, sort } = buildPagination(req.query, ORDER_LIST_DEFAULTS);

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(pageSize).populate("commerce", "name logo"),
    Order.countDocuments(filter),
  ]);

  return { orders, total, page, pageSize };
}

export async function createOrder(req, res, next) {
  try {
    const order = await createOrderForClient({
      clientId: req.user.id,
      addressId: req.body.addressId,
      items: req.body.items,
    });

    return success(res, { statusCode: 201, message: "Pedido creado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const { orders, total, page, pageSize } = await listOrders(req, { client: req.user.id });

    const items = orders.map((order) => ({
      id: order._id,
      status: order.status,
      commerce: order.commerce,
      total: order.total,
      itemsCount: order.items.length,
      createdAt: order.createdAt,
    }));

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getMyOrderDetail(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, client: req.user.id })
      .populate("commerce", "name logo")
      .populate("address");

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    return success(res, { data: order });
  } catch (err) {
    return next(err);
  }
}

export async function getCommerceOrders(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const { orders, total, page, pageSize } = await listOrders(req, { commerce: commerceId });

    return success(res, { data: buildPaginatedResponse({ items: orders, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getCommerceOrderDetail(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const order = await Order.findOne({ _id: req.params.id, commerce: commerceId })
      .populate("commerce", "name logo")
      .populate("delivery", "firstName lastName phone")
      .populate("address");

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    return success(res, {
      data: { ...order.toObject(), canAssignDelivery: order.status === ORDER_STATUS.PENDING },
    });
  } catch (err) {
    return next(err);
  }
}

export async function assignDelivery(req, res, next) {
  try {
    const commerceId = await getCommerceIdByUser(req.user.id);
    const order = await assignDeliveryToOrder({ orderId: req.params.id, commerceId });

    return success(res, { message: "Delivery asignado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}

export async function getDeliveryOrders(req, res, next) {
  try {
    const { orders, total, page, pageSize } = await listOrders(req, { delivery: req.user.id });

    return success(res, { data: buildPaginatedResponse({ items: orders, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

export async function getDeliveryOrderDetail(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, delivery: req.user.id })
      .populate("commerce", "name logo")
      .populate("address");

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    return success(res, { data: hideAddressWhenCompleted(order.toObject()) });
  } catch (err) {
    return next(err);
  }
}

export async function completeOrder(req, res, next) {
  try {
    const order = await completeAssignedOrder({ orderId: req.params.id, deliveryId: req.user.id });

    return success(res, { message: "Pedido completado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}
