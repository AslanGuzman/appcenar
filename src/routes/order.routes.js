import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { createOrderValidator } from "../validators/order.validator.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderDetail,
  getCommerceOrders,
  getCommerceOrderDetail,
  assignDelivery,
  getDeliveryOrders,
  getDeliveryOrderDetail,
  completeOrder,
} from "../controllers/order.controller.js";

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Pedidos (Client, Commerce, Delivery)
 */

/* ------------------------- Client ------------------------- */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear un pedido (Client)
 *     tags: [Orders]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer }
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Datos inválidos }
 */
router.post("/", authorize(ROLES.CLIENT), createOrderValidator, runValidation, createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Listar mis pedidos (Client)
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/my-orders", authorize(ROLES.CLIENT), getMyOrders);

/**
 * @swagger
 * /api/orders/my-orders/{id}:
 *   get:
 *     summary: Detalle de un pedido del cliente
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/my-orders/:id", authorize(ROLES.CLIENT), getMyOrderDetail);

/* ------------------------- Commerce ------------------------- */

/**
 * @swagger
 * /api/orders/commerce:
 *   get:
 *     summary: Listar pedidos del comercio autenticado
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/commerce", authorize(ROLES.COMMERCE), getCommerceOrders);

/**
 * @swagger
 * /api/orders/commerce/{id}:
 *   get:
 *     summary: Detalle de un pedido del comercio autenticado
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/commerce/:id", authorize(ROLES.COMMERCE), getCommerceOrderDetail);

/**
 * @swagger
 * /api/orders/{id}/assign-delivery:
 *   patch:
 *     summary: Asignar delivery automáticamente a un pedido pendiente
 *     tags: [Orders]
 *     responses:
 *       200: { description: Asignado }
 *       409: { description: No hay delivery disponible }
 */
router.patch("/:id/assign-delivery", authorize(ROLES.COMMERCE), assignDelivery);

/* ------------------------- Delivery ------------------------- */

/**
 * @swagger
 * /api/orders/delivery:
 *   get:
 *     summary: Listar pedidos asignados al delivery autenticado
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/delivery", authorize(ROLES.DELIVERY), getDeliveryOrders);

/**
 * @swagger
 * /api/orders/delivery/{id}:
 *   get:
 *     summary: Detalle de un pedido asignado al delivery autenticado
 *     tags: [Orders]
 *     responses:
 *       200: { description: OK }
 */
router.get("/delivery/:id", authorize(ROLES.DELIVERY), getDeliveryOrderDetail);

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   patch:
 *     summary: Marcar un pedido en proceso como completado
 *     tags: [Orders]
 *     responses:
 *       200: { description: Completado }
 */
router.patch("/:id/complete", authorize(ROLES.DELIVERY), completeOrder);

export default router;
