import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Address } from "../models/Address.js";
import { Commerce } from "../models/Commerce.js";
import { User } from "../models/User.js";
import { ORDER_STATUS, ROLES } from "../utils/constants.js";
import { success, fail } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { buildPagination, buildPaginatedResponse } from "../utils/pagination.js";
import { getItbisPercentage } from "./configuration.controller.js";

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

// POST /api/orders
export async function createOrder(req, res, next) {
  try {
    const { addressId, items } = req.body;

    const address = await Address.findOne({ _id: addressId, client: req.user.id });
    if (!address) {
      return fail(res, { statusCode: 400, message: "La dirección indicada no pertenece a tu cuenta." });
    }

    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true });

    if (products.length !== productIds.length) {
      return fail(res, { statusCode: 404, message: "Uno o más productos no existen o no están disponibles." });
    }

    const commerceIds = [...new Set(products.map((p) => p.commerce.toString()))];
    if (commerceIds.length > 1) {
      return fail(res, { statusCode: 400, message: "Todos los productos del pedido deben pertenecer al mismo comercio." });
    }

    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itbisPercentage = await getItbisPercentage();
    const itbisAmount = Number(((subtotal * itbisPercentage) / 100).toFixed(2));
    const total = Number((subtotal + itbisAmount).toFixed(2));

    const order = await Order.create({
      client: req.user.id,
      commerce: commerceIds[0],
      address: address._id,
      items: orderItems,
      subtotal,
      itbisPercentage,
      itbisAmount,
      total,
      status: ORDER_STATUS.PENDING,
    });

    return success(res, { statusCode: 201, message: "Pedido creado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}

// GET /api/orders/my-orders
export async function getMyOrders(req, res, next) {
  try {
    const { status } = req.query;
    const { page, pageSize, skip, sort } = buildPagination(req.query, { defaultSortBy: "createdAt", defaultSortDirection: "desc" });

    const filter = { client: req.user.id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(pageSize).populate("commerce", "name logo"),
      Order.countDocuments(filter),
    ]);

    const items = orders.map((o) => ({
      id: o._id,
      status: o.status,
      commerce: o.commerce,
      total: o.total,
      itemsCount: o.items.length,
      createdAt: o.createdAt,
    }));

    return success(res, { data: buildPaginatedResponse({ items, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/orders/my-orders/:id
export async function getMyOrderDetail(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, client: req.user.id }).populate("commerce", "name logo");
    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }
    return success(res, { data: order });
  } catch (err) {
    return next(err);
  }
}

/* ------------------------------------------------------------------ */
/* Commerce                                                             */
/* ------------------------------------------------------------------ */

async function getCommerceIdFromUser(userId) {
  const commerce = await Commerce.findOne({ user: userId });
  return commerce ? commerce._id : null;
}

// GET /api/orders/commerce
export async function getCommerceOrders(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const { status } = req.query;
    const { page, pageSize, skip } = buildPagination(req.query, { defaultSortBy: "createdAt", defaultSortDirection: "desc" });

    const filter = { commerce: commerceId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("commerce", "name logo"),
      Order.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items: orders, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/orders/commerce/:id
export async function getCommerceOrderDetail(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const order = await Order.findOne({ _id: req.params.id, commerce: commerceId });
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

// PATCH /api/orders/:id/assign-delivery
export async function assignDelivery(req, res, next) {
  try {
    const commerceId = await getCommerceIdFromUser(req.user.id);
    const order = await Order.findOne({ _id: req.params.id, commerce: commerceId });

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      return fail(res, { statusCode: 400, message: "Solo se puede asignar delivery a pedidos pendientes." });
    }

    const availableDelivery = await User.findOne({
      role: ROLES.DELIVERY,
      isActive: true,
      isAvailable: true,
    });

    if (!availableDelivery) {
      return fail(res, { statusCode: 409, message: "No hay delivery disponible en este momento. Intenta más tarde." });
    }

    order.delivery = availableDelivery._id;
    order.status = ORDER_STATUS.IN_PROGRESS;
    await order.save();

    availableDelivery.isAvailable = false;
    await availableDelivery.save();

    return success(res, { message: "Delivery asignado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}

/* ------------------------------------------------------------------ */
/* Delivery                                                             */
/* ------------------------------------------------------------------ */

// GET /api/orders/delivery
export async function getDeliveryOrders(req, res, next) {
  try {
    const { status } = req.query;
    const { page, pageSize, skip } = buildPagination(req.query, { defaultSortBy: "createdAt", defaultSortDirection: "desc" });

    const filter = { delivery: req.user.id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).populate("commerce", "name logo"),
      Order.countDocuments(filter),
    ]);

    return success(res, { data: buildPaginatedResponse({ items: orders, total, page, pageSize }) });
  } catch (err) {
    return next(err);
  }
}

// GET /api/orders/delivery/:id
export async function getDeliveryOrderDetail(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, delivery: req.user.id })
      .populate("commerce", "name logo")
      .populate("address");

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    const payload = order.toObject();

    // La dirección solo se muestra mientras el pedido está en proceso
    if (order.status === ORDER_STATUS.COMPLETED) {
      delete payload.address;
    }

    return success(res, { data: payload });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/orders/:id/complete
export async function completeOrder(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, delivery: req.user.id });

    if (!order) {
      return fail(res, { statusCode: 404, message: "Pedido no encontrado." });
    }

    if (order.status !== ORDER_STATUS.IN_PROGRESS) {
      return fail(res, { statusCode: 400, message: "Solo se pueden completar pedidos en proceso." });
    }

    order.status = ORDER_STATUS.COMPLETED;
    await order.save();

    await User.findByIdAndUpdate(req.user.id, { isAvailable: true });

    return success(res, { message: "Pedido completado correctamente.", data: order });
  } catch (err) {
    return next(err);
  }
}
