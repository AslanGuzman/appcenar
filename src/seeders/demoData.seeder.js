import bcrypt from "bcryptjs";
import { CommerceType } from "../models/CommerceType.js";
import { Commerce } from "../models/Commerce.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Address } from "../models/Address.js";
import { Favorite } from "../models/Favorite.js";
import { Order } from "../models/Order.js";
import { Configuration } from "../models/Configuration.js";
import { ROLES, ORDER_STATUS } from "../utils/constants.js";

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = "Demo123!";

const icon = (label, bg) => `https://placehold.co/96x96/${bg}/ffffff?text=${encodeURIComponent(label)}`;

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

const DEMO_COMMERCE_TYPE_NAMES = ["Restaurantes", "Farmacias", "Supermercados", "Cafeterías"];
const DEMO_USERNAMES = [
  "parrillada_demo",
  "farmacia_demo",
  "super_demo",
  "cafearoma_demo",
  "ana_demo",
  "luis_demo",
  "carlos_demo",
  "maria_demo",
];

async function purgePartialDemoData() {
  const demoUsers = await User.find({ userName: { $in: DEMO_USERNAMES } }).select("_id");
  const demoUserIds = demoUsers.map((u) => u._id);

  const demoCommerces = await Commerce.find({ user: { $in: demoUserIds } }).select("_id");
  const demoCommerceIds = demoCommerces.map((c) => c._id);

  await Product.deleteMany({ commerce: { $in: demoCommerceIds } });
  await Category.deleteMany({ commerce: { $in: demoCommerceIds } });
  await Order.deleteMany({
    $or: [{ commerce: { $in: demoCommerceIds } }, { client: { $in: demoUserIds } }, { delivery: { $in: demoUserIds } }],
  });
  await Favorite.deleteMany({ $or: [{ commerce: { $in: demoCommerceIds } }, { client: { $in: demoUserIds } }] });
  await Address.deleteMany({ client: { $in: demoUserIds } });
  await Commerce.deleteMany({ _id: { $in: demoCommerceIds } });
  await User.deleteMany({ _id: { $in: demoUserIds } });
  await CommerceType.deleteMany({ name: { $in: DEMO_COMMERCE_TYPE_NAMES } });
  await Configuration.deleteOne({ key: "DEMO_SEEDED" });
}

export async function seedDemoData() {
  const seededFlag = await Configuration.findOne({ key: "DEMO_SEEDED" });
  if (seededFlag) {
    return;
  }

  await purgePartialDemoData();

  console.log("[seeder] Sembrando datos de demostración...");

  const [restaurantes, farmacias, supermercados, cafeterias] = await CommerceType.create([
    { name: "Restaurantes", description: "Comida preparada para pedir a domicilio.", icon: icon("R", "d95d39") },
    { name: "Farmacias", description: "Medicamentos y productos de cuidado personal.", icon: icon("F", "2f6f5e") },
    { name: "Supermercados", description: "Víveres y productos del hogar.", icon: icon("S", "b8492b") },
    { name: "Cafeterías", description: "Café, postres y meriendas.", icon: icon("C", "6b7370") },
  ]);

  const commerceDefs = [
    {
      name: "La Parrillada Criolla",
      email: "parrillada@demo.com",
      userName: "parrillada_demo",
      phone: "8095551001",
      openingTime: "11:00",
      closingTime: "22:00",
      commerceType: restaurantes._id,
      description: "Comida criolla a la parrilla, directo a tu mesa.",
      categories: [
        { name: "Platos fuertes", description: "Carnes y acompañantes." },
        { name: "Bebidas", description: "Refrescos y jugos naturales." },
      ],
      products: [
        { category: 0, name: "Pollo guisado con moro", description: "Pollo guisado, moro de guandules y ensalada.", price: 380 },
        { category: 0, name: "Costillas BBQ", description: "Costillas de cerdo bañadas en salsa BBQ.", price: 520 },
        { category: 1, name: "Jugo de chinola", description: "Jugo natural de chinola, 16oz.", price: 90 },
      ],
    },
    {
      name: "Farmacia Central",
      email: "farmacia@demo.com",
      userName: "farmacia_demo",
      phone: "8095551002",
      openingTime: "08:00",
      closingTime: "23:00",
      commerceType: farmacias._id,
      description: "Medicamentos y cuidado personal a domicilio.",
      categories: [
        { name: "Medicamentos", description: "Analgésicos y antigripales de venta libre." },
        { name: "Cuidado personal", description: "Higiene y bienestar." },
      ],
      products: [
        { category: 0, name: "Acetaminofén 500mg (caja)", description: "Caja de 20 tabletas.", price: 150 },
        { category: 1, name: "Protector solar SPF 50", description: "Protector solar facial, 60ml.", price: 480 },
        { category: 1, name: "Alcohol en gel 250ml", description: "Gel antibacterial 70% alcohol.", price: 120 },
      ],
    },
    {
      name: "Supermercado Nacional",
      email: "super@demo.com",
      userName: "super_demo",
      phone: "8095551003",
      openingTime: "07:00",
      closingTime: "21:00",
      commerceType: supermercados._id,
      description: "Víveres frescos y productos del hogar.",
      categories: [
        { name: "Frutas y vegetales", description: "Productos frescos de temporada." },
        { name: "Despensa", description: "Enlatados, granos y más." },
      ],
      products: [
        { category: 0, name: "Funda de guineos (6 unid.)", description: "Guineos maduros, funda de 6.", price: 60 },
        { category: 1, name: "Arroz selecto 5lb", description: "Saco de arroz blanco selecto.", price: 210 },
        { category: 1, name: "Aceite vegetal 1L", description: "Aceite de cocina, botella de 1 litro.", price: 175 },
      ],
    },
    {
      name: "Café Aroma",
      email: "cafearoma@demo.com",
      userName: "cafearoma_demo",
      phone: "8095551004",
      openingTime: "06:30",
      closingTime: "19:00",
      commerceType: cafeterias._id,
      description: "Café recién colado y repostería casera.",
      categories: [
        { name: "Café", description: "Bebidas calientes y frías." },
        { name: "Repostería", description: "Postres horneados en casa." },
      ],
      products: [
        { category: 0, name: "Café con leche grande", description: "Café colado con leche, 16oz.", price: 110 },
        { category: 1, name: "Brownie de chocolate", description: "Porción individual de brownie.", price: 130 },
        { category: 1, name: "Cheesecake de fresa", description: "Porción de cheesecake con fresa.", price: 165 },
      ],
    },
  ];

  const createdCommerces = [];

  for (const def of commerceDefs) {
    const user = await User.create({
      firstName: def.name,
      lastName: "",
      userName: def.userName,
      email: def.email,
      password: await hash(DEMO_PASSWORD),
      phone: def.phone,
      role: ROLES.COMMERCE,
      isActive: true,
    });

    const commerce = await Commerce.create({
      user: user._id,
      name: def.name,
      description: def.description,
      phone: def.phone,
      openingTime: def.openingTime,
      closingTime: def.closingTime,
      commerceType: def.commerceType,
      logo: icon(def.name.charAt(0), "1c2b2a"),
    });

    const categories = await Category.create(
      def.categories.map((c) => ({ commerce: commerce._id, name: c.name, description: c.description }))
    );

    const products = await Product.create(
      def.products.map((p) => ({
        commerce: commerce._id,
        category: categories[p.category]._id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: icon(p.name.charAt(0), "d95d39"),
        isActive: true,
      }))
    );

    createdCommerces.push({ commerce, categories, products });
  }

  const clientDefs = [
    { firstName: "Ana", lastName: "Martínez", userName: "ana_demo", email: "ana@demo.com", phone: "8095552001" },
    { firstName: "Luis", lastName: "Fernández", userName: "luis_demo", email: "luis@demo.com", phone: "8095552002" },
  ];

  const createdClients = [];
  for (const def of clientDefs) {
    const client = await User.create({
      ...def,
      password: await hash(DEMO_PASSWORD),
      role: ROLES.CLIENT,
      isActive: true,
    });
    createdClients.push(client);
  }

  const addresses = await Address.create([
    {
      client: createdClients[0]._id,
      label: "Casa",
      street: "Calle Duarte #45",
      sector: "Los Jardines",
      city: "Santiago",
      reference: "Frente al colmado Doña Ana",
    },
    {
      client: createdClients[0]._id,
      label: "Trabajo",
      street: "Av. 27 de Febrero #120",
      sector: "Piantini",
      city: "Santo Domingo",
      reference: "Edificio Torre Azul, piso 3",
    },
    {
      client: createdClients[1]._id,
      label: "Casa",
      street: "Calle Sol #12",
      sector: "Cerros de Gurabo",
      city: "Santiago",
      reference: "Portón verde",
    },
  ]);

  const deliveryDefs = [
    { firstName: "Carlos", lastName: "Reyes", userName: "carlos_demo", email: "carlos@demo.com", phone: "8095553001" },
    { firstName: "María", lastName: "Pérez", userName: "maria_demo", email: "maria@demo.com", phone: "8095553002" },
  ];

  const createdDeliveries = [];
  for (const def of deliveryDefs) {
    const delivery = await User.create({
      ...def,
      password: await hash(DEMO_PASSWORD),
      role: ROLES.DELIVERY,
      isActive: true,
      isAvailable: true,
    });
    createdDeliveries.push(delivery);
  }

  const itbisConfig = await Configuration.findOne({ key: "ITBIS" });
  const itbisPercentage = itbisConfig ? Number(itbisConfig.value) : 18;

  function buildOrderItems(products, indices) {
    return indices.map((i) => ({
      product: products[i]._id,
      name: products[i].name,
      price: products[i].price,
      image: products[i].image,
      quantity: 1,
    }));
  }

  function calcTotals(items) {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const itbisAmount = Number(((subtotal * itbisPercentage) / 100).toFixed(2));
    const total = Number((subtotal + itbisAmount).toFixed(2));
    return { subtotal, itbisPercentage, itbisAmount, total };
  }

  const items1 = buildOrderItems(createdCommerces[0].products, [0, 2]);
  await Order.create({
    client: createdClients[0]._id,
    commerce: createdCommerces[0].commerce._id,
    address: addresses[0]._id,
    items: items1,
    ...calcTotals(items1),
    status: ORDER_STATUS.PENDING,
  });

  const items2 = buildOrderItems(createdCommerces[3].products, [0, 1]);
  await Order.create({
    client: createdClients[1]._id,
    commerce: createdCommerces[3].commerce._id,
    address: addresses[2]._id,
    delivery: createdDeliveries[0]._id,
    items: items2,
    ...calcTotals(items2),
    status: ORDER_STATUS.IN_PROGRESS,
  });
  createdDeliveries[0].isAvailable = false;
  await createdDeliveries[0].save();

  const items3 = buildOrderItems(createdCommerces[2].products, [1, 2]);
  await Order.create({
    client: createdClients[0]._id,
    commerce: createdCommerces[2].commerce._id,
    address: addresses[1]._id,
    delivery: createdDeliveries[1]._id,
    items: items3,
    ...calcTotals(items3),
    status: ORDER_STATUS.COMPLETED,
  });

  await Configuration.create({
    key: "DEMO_SEEDED",
    value: "true",
    type: "boolean",
    description: "Indica que los datos de demostración ya fueron creados.",
  });

  console.log("[seeder] Datos de demostración creados correctamente.");
  console.log("[seeder] Contraseña para todas las cuentas demo: " + DEMO_PASSWORD);
}
