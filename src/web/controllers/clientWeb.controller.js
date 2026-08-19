import { CommerceType } from "../../models/CommerceType.js";
import { Commerce } from "../../models/Commerce.js";
import { Category } from "../../models/Category.js";
import { Product } from "../../models/Product.js";
import { Address } from "../../models/Address.js";
import { Favorite } from "../../models/Favorite.js";
import { Order } from "../../models/Order.js";
import { User } from "../../models/User.js";
import { Configuration } from "../../models/Configuration.js";
import { ORDER_STATUS } from "../../utils/constants.js";
import { popFormData } from "../utils/formData.js";

/* ---------------------------- Home (público) ---------------------------- */

export async function home(req, res) {
  const commerceTypes = await CommerceType.find().sort({ name: 1 }).lean();
  res.render("client/home", { title: "Home", commerceTypes });
}

/* ---------------------------- Comercios (público) ---------------------------- */

export async function listCommerces(req, res) {
  const { typeId, search } = req.query;

  if (!typeId) {
    req.flash("errors", "Selecciona un tipo de comercio.");
    return res.redirect("/client/home");
  }

  const commerceType = await CommerceType.findById(typeId).lean().catch(() => null);
  if (!commerceType) {
    req.flash("errors", "El tipo de comercio no existe.");
    return res.redirect("/client/home");
  }

  const activeUsers = await User.find({ role: "Commerce", isActive: true }).select("_id").lean();
  const filter = { commerceType: typeId, user: { $in: activeUsers.map((u) => u._id) } };
  if (search) filter.name = { $regex: search, $options: "i" };

  const commerces = await Commerce.find(filter).sort({ name: 1 }).lean();

  const favorites = await Favorite.find({ client: req.session.user.id }).select("commerce").lean();
  const favoriteIds = favorites.map((f) => f.commerce.toString());

  const items = commerces.map((c) => ({ ...c, isFavorite: favoriteIds.includes(c._id.toString()) }));

  res.render("client/commerces", {
    title: commerceType.name,
    commerceType,
    commerces: items,
    total: items.length,
    search: search || "",
  });
}

export async function toggleFavorite(req, res) {
  const { commerceId } = req.params;
  const redirectTo = req.body.redirectTo || "/client/home";

  const existing = await Favorite.findOne({ client: req.session.user.id, commerce: commerceId });

  if (existing) {
    await existing.deleteOne();
  } else {
    const commerce = await Commerce.findById(commerceId);
    if (commerce) await Favorite.create({ client: req.session.user.id, commerce: commerceId });
  }

  return res.redirect(redirectTo);
}

/* ---------------------------- Catálogo y carrito (público) ---------------------------- */

function getCart(req) {
  if (!req.session.cart) req.session.cart = null;
  return req.session.cart;
}

export async function showCatalog(req, res) {
  const { commerceId } = req.params;

  const commerce = await Commerce.findById(commerceId).populate("user", "isActive").lean();
  if (!commerce || !commerce.user?.isActive) {
    req.flash("errors", "El comercio no está disponible.");
    return res.redirect("/client/home");
  }

  const categories = await Category.find({ commerce: commerceId }).sort({ name: 1 }).lean();
  const products = await Product.find({ commerce: commerceId, isActive: true }).lean();

  const catalog = categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.category.toString() === category._id.toString()),
    }))
    .filter((group) => group.products.length > 0);

  const cart = getCart(req);
  const cartForThisCommerce = cart && cart.commerceId === commerceId ? cart : null;

  res.render("client/catalog", {
    title: commerce.name,
    commerce,
    catalog,
    cart: cartForThisCommerce,
    cartProductIds: cartForThisCommerce ? cartForThisCommerce.items.map((i) => i.productId) : [],
    subtotal: cartForThisCommerce ? cartForThisCommerce.items.reduce((s, i) => s + i.price, 0) : 0,
  });
}

export async function addToCart(req, res) {
  const { productId, commerceId } = req.body;

  const product = await Product.findOne({ _id: productId, commerce: commerceId, isActive: true });
  if (!product) {
    req.flash("errors", "El producto no está disponible.");
    return res.redirect(`/client/catalog/${commerceId}`);
  }

  let cart = getCart(req);

  if (!cart || cart.commerceId !== commerceId) {
    cart = { commerceId, items: [] };
  }

  const alreadyAdded = cart.items.some((i) => i.productId === productId);
  if (!alreadyAdded) {
    cart.items.push({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  req.session.cart = cart;
  return res.redirect(`/client/catalog/${commerceId}`);
}

export async function removeFromCart(req, res) {
  const { commerceId, productId } = req.params;
  const cart = getCart(req);

  if (cart && cart.commerceId === commerceId) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
    req.session.cart = cart.items.length ? cart : null;
  }

  return res.redirect(`/client/catalog/${commerceId}`);
}

/* ---------------------------- Checkout (requiere sesión) ---------------------------- */

export async function showCheckout(req, res) {
  const cart = getCart(req);

  if (!cart || !cart.items.length) {
    req.flash("errors", "Tu pedido está vacío.");
    return res.redirect("/client/home");
  }

  const commerce = await Commerce.findById(cart.commerceId).lean();
  const addresses = await Address.find({ client: req.session.user.id }).sort({ createdAt: -1 }).lean();

  const itbisConfig = await Configuration.findOne({ key: "ITBIS" }).lean();
  const itbisPercentage = itbisConfig ? Number(itbisConfig.value) : 0;

  const subtotal = cart.items.reduce((s, i) => s + i.price, 0);
  const itbisAmount = Number(((subtotal * itbisPercentage) / 100).toFixed(2));
  const total = Number((subtotal + itbisAmount).toFixed(2));

  res.render("client/checkout", {
    title: "Confirmar pedido",
    commerce,
    cart,
    addresses,
    subtotal,
    itbisPercentage,
    itbisAmount,
    total,
  });
}

export async function placeOrder(req, res) {
  const { addressId } = req.body;
  const cart = getCart(req);

  if (!cart || !cart.items.length) {
    req.flash("errors", "Tu pedido está vacío.");
    return res.redirect("/client/home");
  }

  const address = await Address.findOne({ _id: addressId, client: req.session.user.id });
  if (!address) {
    req.flash("errors", "Selecciona una dirección válida.");
    return res.redirect("/client/checkout");
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const orderItems = cart.items
    .map((cartItem) => {
      const product = products.find((p) => p._id.toString() === cartItem.productId);
      if (!product) return null;
      return { product: product._id, name: product.name, price: product.price, image: product.image, quantity: 1 };
    })
    .filter(Boolean);

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const itbisConfig = await Configuration.findOne({ key: "ITBIS" });
  const itbisPercentage = itbisConfig ? Number(itbisConfig.value) : 0;
  const itbisAmount = Number(((subtotal * itbisPercentage) / 100).toFixed(2));
  const total = Number((subtotal + itbisAmount).toFixed(2));

  await Order.create({
    client: req.session.user.id,
    commerce: cart.commerceId,
    address: address._id,
    items: orderItems,
    subtotal,
    itbisPercentage,
    itbisAmount,
    total,
    status: ORDER_STATUS.PENDING,
  });

  req.session.cart = null;
  req.flash("success", "Tu pedido fue creado correctamente.");
  return res.redirect("/client/home");
}

/* ---------------------------- Perfil ---------------------------- */

export async function showProfile(req, res) {
  const user = await User.findById(req.session.user.id).lean();
  res.render("client/profile", { title: "Mi perfil", profile: { ...user, ...popFormData(req) } });
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
  return res.redirect("/client/profile");
}

/* ---------------------------- Pedidos ---------------------------- */

export async function listOrders(req, res) {
  const orders = await Order.find({ client: req.session.user.id }).sort({ createdAt: -1 }).populate("commerce", "name logo").lean();
  res.render("client/orders", { title: "Mis pedidos", orders });
}

export async function showOrderDetail(req, res) {
  const order = await Order.findOne({ _id: req.params.id, client: req.session.user.id }).populate("commerce", "name logo").lean();
  if (!order) {
    req.flash("errors", "Pedido no encontrado.");
    return res.redirect("/client/orders");
  }
  res.render("client/order-detail", { title: "Detalle del pedido", order });
}

/* ---------------------------- Direcciones ---------------------------- */

export async function listAddresses(req, res) {
  const addresses = await Address.find({ client: req.session.user.id }).sort({ createdAt: -1 }).lean();
  res.render("client/addresses", { title: "Mis direcciones", addresses });
}

export function showNewAddress(req, res) {
  res.render("client/address-form", {
    title: "Nueva dirección",
    address: popFormData(req),
    formAction: "/client/addresses",
  });
}

export async function createAddress(req, res) {
  const { label, street, sector, city, reference } = req.body;
  await Address.create({ client: req.session.user.id, label, street, sector, city, reference });
  req.flash("success", "Dirección creada correctamente.");
  return res.redirect("/client/addresses");
}

export async function showEditAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, client: req.session.user.id }).lean();
  if (!address) {
    req.flash("errors", "Dirección no encontrada.");
    return res.redirect("/client/addresses");
  }
  res.render("client/address-form", {
    title: "Editar dirección",
    address: { ...address, ...popFormData(req) },
    formAction: `/client/addresses/${address._id}`,
  });
}

export async function updateAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, client: req.session.user.id });
  if (!address) {
    req.flash("errors", "Dirección no encontrada.");
    return res.redirect("/client/addresses");
  }
  Object.assign(address, req.body);
  await address.save();
  req.flash("success", "Dirección actualizada correctamente.");
  return res.redirect("/client/addresses");
}

export async function confirmDeleteAddress(req, res) {
  const address = await Address.findOne({ _id: req.params.id, client: req.session.user.id }).lean();
  if (!address) {
    req.flash("errors", "Dirección no encontrada.");
    return res.redirect("/client/addresses");
  }
  res.render("client/address-delete", { title: "Eliminar dirección", address });
}

export async function deleteAddress(req, res) {
  await Address.deleteOne({ _id: req.params.id, client: req.session.user.id });
  req.flash("success", "Dirección eliminada correctamente.");
  return res.redirect("/client/addresses");
}

/* ---------------------------- Favoritos ---------------------------- */

export async function listFavorites(req, res) {
  const favorites = await Favorite.find({ client: req.session.user.id }).populate("commerce", "name logo").sort({ createdAt: -1 }).lean();
  res.render("client/favorites", { title: "Mis favoritos", favorites: favorites.filter((f) => f.commerce) });
}

export async function removeFavorite(req, res) {
  await Favorite.deleteOne({ client: req.session.user.id, commerce: req.params.commerceId });
  return res.redirect("/client/favorites");
}
