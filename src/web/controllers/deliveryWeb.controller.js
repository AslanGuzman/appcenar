import { Order } from "../../models/Order.js";
import { User } from "../../models/User.js";
import { ORDER_STATUS } from "../../utils/constants.js";
import { popFormData } from "../utils/formData.js";
import { completeOrder as completeAssignedOrder } from "../../services/order.service.js";

export async function home(req, res) {
  const orders = await Order.find({ delivery: req.session.user.id })
    .sort({ createdAt: -1 })
    .populate("commerce", "name logo")
    .lean();
  res.render("delivery/home", { title: "Mis pedidos", orders });
}

export async function showOrderDetail(req, res) {
  const order = await Order.findOne({ _id: req.params.id, delivery: req.session.user.id })
    .populate("commerce", "name logo")
    .populate("address")
    .lean();

  if (!order) {
    req.flash("errors", "Pedido no encontrado.");
    return res.redirect("/delivery/home");
  }

  if (order.status === ORDER_STATUS.COMPLETED) {
    delete order.address;
  }

  res.render("delivery/order-detail", {
    title: "Detalle del pedido",
    order,
    showAddress: order.status === ORDER_STATUS.IN_PROGRESS,
    canComplete: order.status === ORDER_STATUS.IN_PROGRESS,
  });
}

export async function completeOrder(req, res) {
  try {
    await completeAssignedOrder({ orderId: req.params.id, deliveryId: req.session.user.id });
    req.flash("success", "Pedido completado correctamente.");
  } catch (err) {
    req.flash("errors", err.message);
  }

  return res.redirect(`/delivery/orders/${req.params.id}`);
}

export async function showProfile(req, res) {
  const user = await User.findById(req.session.user.id).lean();
  res.render("delivery/profile", { title: "Mi perfil", profile: { ...user, ...popFormData(req) } });
}

export async function updateProfile(req, res) {
  const user = await User.findById(req.session.user.id);

  const { firstName, lastName, phone } = req.body;
  user.firstName = firstName;
  user.lastName = lastName;
  user.phone = phone;
  if (req.file) user.profileImage = `/uploads/${req.file.filename}`;
  await user.save();

  req.session.user.firstName = user.firstName;
  req.flash("success", "Perfil actualizado correctamente.");
  return res.redirect("/delivery/profile");
}
