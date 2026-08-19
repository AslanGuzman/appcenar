import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { ROLES } from "../utils/constants.js";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function countUsers(role, isActive) {
  return User.countDocuments({ role, isActive });
}

export async function getDashboardMetrics() {
  const [
    totalOrders,
    ordersToday,
    commercesActive,
    commercesInactive,
    clientsActive,
    clientsInactive,
    deliveriesActive,
    deliveriesInactive,
    totalProducts,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfToday() } }),
    countUsers(ROLES.COMMERCE, true),
    countUsers(ROLES.COMMERCE, false),
    countUsers(ROLES.CLIENT, true),
    countUsers(ROLES.CLIENT, false),
    countUsers(ROLES.DELIVERY, true),
    countUsers(ROLES.DELIVERY, false),
    Product.countDocuments(),
  ]);

  return {
    orders: { total: totalOrders, today: ordersToday },
    commerces: { active: commercesActive, inactive: commercesInactive },
    clients: { active: clientsActive, inactive: clientsInactive },
    deliveries: { active: deliveriesActive, inactive: deliveriesInactive },
    products: { total: totalProducts },
  };
}
