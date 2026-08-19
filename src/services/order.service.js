import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Address } from "../models/Address.js";
import { User } from "../models/User.js";
import { ORDER_STATUS, ORDER_STATUS_SEQUENCE, ROLES } from "../utils/constants.js";
import { AppError } from "../utils/appError.js";
import { getItbisPercentage, calculateOrderTotals } from "./configuration.service.js";

function consolidateQuantities(items) {
  return items.reduce((acc, item) => {
    const id = String(item.productId);
    acc.set(id, (acc.get(id) || 0) + Number(item.quantity));
    return acc;
  }, new Map());
}

export async function createOrder({ clientId, addressId, items }) {
  const address = await Address.findOne({ _id: addressId, client: clientId });

  if (!address) {
    throw new AppError("La dirección indicada no pertenece a tu cuenta.", 400);
  }

  const quantityByProductId = consolidateQuantities(items);
  const productIds = [...quantityByProductId.keys()];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  if (products.length !== productIds.length) {
    throw new AppError("Uno o más productos no existen o no están disponibles.", 404);
  }

  const commerceIds = [...new Set(products.map((product) => String(product.commerce)))];

  if (commerceIds.length > 1) {
    throw new AppError("Todos los productos del pedido deben pertenecer al mismo comercio.", 400);
  }

  const orderItems = products.map((product) => ({
    product: product._id,
    name: product.name,
    price: product.price,
    image: product.image,
    quantity: quantityByProductId.get(String(product._id)),
  }));

  const totals = calculateOrderTotals(orderItems, await getItbisPercentage());

  return Order.create({
    client: clientId,
    commerce: commerceIds[0],
    address: address._id,
    items: orderItems,
    ...totals,
    status: ORDER_STATUS.PENDING,
  });
}

export async function assignDelivery({ orderId, commerceId }) {
  const order = await Order.findOne({ _id: orderId, commerce: commerceId });

  if (!order) {
    throw new AppError("Pedido no encontrado.", 404);
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new AppError("Solo se puede asignar delivery a pedidos pendientes.", 400);
  }

  const availableDelivery = await User.findOneAndUpdate(
    { role: ROLES.DELIVERY, isActive: true, isAvailable: true },
    { isAvailable: false },
    { new: true }
  );

  if (!availableDelivery) {
    throw new AppError("No hay delivery disponible en este momento. Intenta más tarde.", 409);
  }

  order.delivery = availableDelivery._id;
  order.status = ORDER_STATUS.IN_PROGRESS;
  await order.save();

  return order;
}

export async function completeOrder({ orderId, deliveryId }) {
  const order = await Order.findOne({ _id: orderId, delivery: deliveryId });

  if (!order) {
    throw new AppError("Pedido no encontrado.", 404);
  }

  if (order.status !== ORDER_STATUS.IN_PROGRESS) {
    throw new AppError("Solo se pueden completar pedidos en proceso.", 400);
  }

  order.status = ORDER_STATUS.COMPLETED;
  await order.save();

  await User.findByIdAndUpdate(deliveryId, { isAvailable: true });

  return order;
}

export function sortByStatusThenNewest(orders) {
  return [...orders].sort((a, b) => {
    const byStatus = ORDER_STATUS_SEQUENCE.indexOf(a.status) - ORDER_STATUS_SEQUENCE.indexOf(b.status);
    return byStatus !== 0 ? byStatus : new Date(b.createdAt) - new Date(a.createdAt);
  });
}

export function hideAddressWhenCompleted(order) {
  if (order.status !== ORDER_STATUS.COMPLETED) {
    return order;
  }

  const { address, ...rest } = order;
  return rest;
}
