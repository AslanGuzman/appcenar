import { Commerce } from "../../models/Commerce.js";
import { Category } from "../../models/Category.js";
import { Product } from "../../models/Product.js";
import { Order } from "../../models/Order.js";
import { User } from "../../models/User.js";
import { ROLES, ORDER_STATUS } from "../../utils/constants.js";
import { popFormData } from "../utils/formData.js";

async function getCommerce(userId) {
  return Commerce.findOne({ user: userId });
}

function toProductForm(req, product = {}) {
  const { categoryId, ...rest } = popFormData(req);
  return { ...product, ...rest, ...(categoryId && { category: categoryId }) };
}

/* ---------------------------- Home / Pedidos ---------------------------- */

export async function home(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const orders = await Order.find({ commerce: commerce._id }).sort({ createdAt: -1 }).lean();
  res.render("commerce/home", { title: "Pedidos", orders });
}

export async function showOrderDetail(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const order = await Order.findOne({ _id: req.params.id, commerce: commerce._id })
    .populate("delivery", "firstName lastName phone")
    .lean();

  if (!order) {
    req.flash("errors", "Pedido no encontrado.");
    return res.redirect("/commerce/home");
  }

  res.render("commerce/order-detail", {
    title: "Detalle del pedido",
    order,
    canAssign: order.status === ORDER_STATUS.PENDING,
  });
}

export async function assignDelivery(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const order = await Order.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!order || order.status !== ORDER_STATUS.PENDING) {
    req.flash("errors", "Este pedido ya no está pendiente.");
    return res.redirect(`/commerce/orders/${req.params.id}`);
  }

  const availableDelivery = await User.findOne({ role: ROLES.DELIVERY, isActive: true, isAvailable: true });

  if (!availableDelivery) {
    req.flash("errors", "No hay delivery disponible en este momento. Intenta más tarde.");
    return res.redirect(`/commerce/orders/${req.params.id}`);
  }

  order.delivery = availableDelivery._id;
  order.status = ORDER_STATUS.IN_PROGRESS;
  await order.save();

  availableDelivery.isAvailable = false;
  await availableDelivery.save();

  req.flash("success", "Delivery asignado correctamente.");
  return res.redirect(`/commerce/orders/${req.params.id}`);
}

/* ---------------------------- Perfil ---------------------------- */

export async function showProfile(req, res) {
  const commerce = await Commerce.findOne({ user: req.session.user.id }).lean();
  const user = await User.findById(req.session.user.id).lean();
  const formData = popFormData(req);
  res.render("commerce/profile", {
    title: "Mi perfil",
    commerce: { ...commerce, ...formData },
    user: { ...user, ...formData },
  });
}

export async function updateProfile(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const user = await User.findById(req.session.user.id);

  const { email, phone, openingTime, closingTime } = req.body;
  user.email = email.toLowerCase();
  user.phone = phone;
  commerce.openingTime = openingTime;
  commerce.closingTime = closingTime;
  if (req.file) commerce.logo = `/uploads/${req.file.filename}`;

  await user.save();
  await commerce.save();

  req.flash("success", "Perfil actualizado correctamente.");
  return res.redirect("/commerce/profile");
}

/* ---------------------------- Categorías ---------------------------- */

export async function listCategories(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const categories = await Category.find({ commerce: commerce._id }).sort({ name: 1 }).lean();

  const withCounts = await Promise.all(
    categories.map(async (c) => ({ ...c, productCount: await Product.countDocuments({ category: c._id }) }))
  );

  res.render("commerce/categories", { title: "Categorías", categories: withCounts });
}

export function showNewCategory(req, res) {
  res.render("commerce/category-form", {
    title: "Nueva categoría",
    category: popFormData(req),
    formAction: "/commerce/categories",
  });
}

export async function createCategory(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const { name, description } = req.body;
  await Category.create({ commerce: commerce._id, name, description });
  req.flash("success", "Categoría creada correctamente.");
  return res.redirect("/commerce/categories");
}

export async function showEditCategory(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const category = await Category.findOne({ _id: req.params.id, commerce: commerce._id }).lean();
  if (!category) {
    req.flash("errors", "Categoría no encontrada.");
    return res.redirect("/commerce/categories");
  }
  res.render("commerce/category-form", {
    title: "Editar categoría",
    category: { ...category, ...popFormData(req) },
    formAction: `/commerce/categories/${category._id}`,
  });
}

export async function updateCategory(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const category = await Category.findOne({ _id: req.params.id, commerce: commerce._id });
  if (!category) {
    req.flash("errors", "Categoría no encontrada.");
    return res.redirect("/commerce/categories");
  }
  category.name = req.body.name;
  category.description = req.body.description;
  await category.save();
  req.flash("success", "Categoría actualizada correctamente.");
  return res.redirect("/commerce/categories");
}

export async function confirmDeleteCategory(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const category = await Category.findOne({ _id: req.params.id, commerce: commerce._id }).lean();
  if (!category) {
    req.flash("errors", "Categoría no encontrada.");
    return res.redirect("/commerce/categories");
  }
  res.render("commerce/category-delete", { title: "Eliminar categoría", category });
}

export async function deleteCategory(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const category = await Category.findOne({ _id: req.params.id, commerce: commerce._id });
  if (category) {
    await Product.deleteMany({ category: category._id });
    await category.deleteOne();
  }
  req.flash("success", "Categoría eliminada correctamente.");
  return res.redirect("/commerce/categories");
}

/* ---------------------------- Productos ---------------------------- */

export async function listProducts(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const products = await Product.find({ commerce: commerce._id }).populate("category", "name").sort({ name: 1 }).lean();
  res.render("commerce/products", { title: "Productos", products });
}

export async function showNewProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const categories = await Category.find({ commerce: commerce._id }).sort({ name: 1 }).lean();

  if (!categories.length) {
    req.flash("errors", "Debes crear al menos una categoría antes de agregar productos.");
    return res.redirect("/commerce/categories");
  }

  res.render("commerce/product-form", {
    title: "Nuevo producto",
    product: toProductForm(req),
    categories,
    formAction: "/commerce/products",
  });
}

export async function createProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const { name, description, price, categoryId } = req.body;

  const category = await Category.findOne({ _id: categoryId, commerce: commerce._id });
  if (!category) {
    req.flash("errors", "La categoría seleccionada no es válida.");
    return res.redirect("/commerce/products/new");
  }

  await Product.create({
    commerce: commerce._id,
    category: categoryId,
    name,
    description,
    price: Number(price),
    image: req.file ? `/uploads/${req.file.filename}` : null,
  });

  req.flash("success", "Producto creado correctamente.");
  return res.redirect("/commerce/products");
}

export async function showEditProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const [product, categories] = await Promise.all([
    Product.findOne({ _id: req.params.id, commerce: commerce._id }).lean(),
    Category.find({ commerce: commerce._id }).sort({ name: 1 }).lean(),
  ]);

  if (!product) {
    req.flash("errors", "Producto no encontrado.");
    return res.redirect("/commerce/products");
  }

  res.render("commerce/product-form", {
    title: "Editar producto",
    product: toProductForm(req, product),
    categories,
    formAction: `/commerce/products/${product._id}`,
  });
}

export async function updateProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const product = await Product.findOne({ _id: req.params.id, commerce: commerce._id });

  if (!product) {
    req.flash("errors", "Producto no encontrado.");
    return res.redirect("/commerce/products");
  }

  const { name, description, price, categoryId } = req.body;
  product.name = name;
  product.description = description;
  product.price = Number(price);
  product.category = categoryId;
  if (req.file) product.image = `/uploads/${req.file.filename}`;

  await product.save();
  req.flash("success", "Producto actualizado correctamente.");
  return res.redirect("/commerce/products");
}

export async function confirmDeleteProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  const product = await Product.findOne({ _id: req.params.id, commerce: commerce._id }).lean();
  if (!product) {
    req.flash("errors", "Producto no encontrado.");
    return res.redirect("/commerce/products");
  }
  res.render("commerce/product-delete", { title: "Eliminar producto", product });
}

export async function deleteProduct(req, res) {
  const commerce = await getCommerce(req.session.user.id);
  await Product.deleteOne({ _id: req.params.id, commerce: commerce._id });
  req.flash("success", "Producto eliminado correctamente.");
  return res.redirect("/commerce/products");
}
