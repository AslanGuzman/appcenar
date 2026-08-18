import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { ROLES } from "../utils/constants.js";
import { success } from "../utils/apiResponse.js";

export async function getDashboardMetrics(req, res, next) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

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
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ role: ROLES.COMMERCE, isActive: true }),
      User.countDocuments({ role: ROLES.COMMERCE, isActive: false }),
      User.countDocuments({ role: ROLES.CLIENT, isActive: true }),
      User.countDocuments({ role: ROLES.CLIENT, isActive: false }),
      User.countDocuments({ role: ROLES.DELIVERY, isActive: true }),
      User.countDocuments({ role: ROLES.DELIVERY, isActive: false }),
      Product.countDocuments(),
    ]);

    return success(res, {
      data: {
        orders: { total: totalOrders, today: ordersToday },
        commerces: { active: commercesActive, inactive: commercesInactive },
        clients: { active: clientsActive, inactive: clientsInactive },
        deliveries: { active: deliveriesActive, inactive: deliveriesInactive },
        products: { total: totalProducts },
      },
    });
  } catch (err) {
    return next(err);
  }
}
