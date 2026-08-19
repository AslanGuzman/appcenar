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
 * /api/orders:
 *   post:
 *     summary: Crear un pedido (Client)
 *     description: >
 *       Crea el pedido en estado Pending. Todos los productos deben pertenecer al mismo comercio
 *       y la dirección debe pertenecer al cliente autenticado. El sistema calcula subtotal,
 *       ITBIS (según la configuración vigente) y total.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId, items]
 *             properties:
 *               addressId: { type: string }
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer, minimum: 1, example: 2 }
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Sin items, cantidad inválida, dirección ajena o productos de comercios distintos }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Uno o más productos no existen o no están disponibles }
 */
router.post("/", authorize(ROLES.CLIENT), createOrderValidator, runValidation, createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Listar mis pedidos (Client)
 *     description: Incluye estado, nombre y logo del comercio, total, cantidad de productos y fecha.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderStatus'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/my-orders", authorize(ROLES.CLIENT), getMyOrders);

/**
 * @swagger
 * /api/orders/my-orders/{id}:
 *   get:
 *     summary: Detalle de un pedido del cliente
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/my-orders/:id", authorize(ROLES.CLIENT), getMyOrderDetail);

/**
 * @swagger
 * /api/orders/commerce:
 *   get:
 *     summary: Listar pedidos del comercio autenticado
 *     description: Ordenados del más reciente al más antiguo por defecto.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderStatus'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/commerce", authorize(ROLES.COMMERCE), getCommerceOrders);

/**
 * @swagger
 * /api/orders/commerce/{id}:
 *   get:
 *     summary: Detalle de un pedido del comercio autenticado
 *     description: Incluye canAssignDelivery para identificar si el pedido puede asignarse a un delivery.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/commerce/:id", authorize(ROLES.COMMERCE), getCommerceOrderDetail);

/**
 * @swagger
 * /api/orders/{id}/assign-delivery:
 *   patch:
 *     summary: Asignar delivery automáticamente a un pedido pendiente
 *     description: >
 *       Solo el comercio dueño del pedido puede ejecutarlo y solo sobre pedidos Pending.
 *       Toma el primer delivery activo y disponible, cambia el pedido a InProgress y marca al delivery como ocupado.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: Asignado }
 *       400: { description: El pedido no está en estado Pending }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: No hay delivery disponible }
 */
router.patch("/:id/assign-delivery", authorize(ROLES.COMMERCE), assignDelivery);

/**
 * @swagger
 * /api/orders/delivery:
 *   get:
 *     summary: Listar pedidos asignados al delivery autenticado
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderStatus'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/delivery", authorize(ROLES.DELIVERY), getDeliveryOrders);

/**
 * @swagger
 * /api/orders/delivery/{id}:
 *   get:
 *     summary: Detalle de un pedido asignado al delivery autenticado
 *     description: La dirección de entrega solo se incluye mientras el pedido está InProgress; al completarse deja de mostrarse.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/delivery/:id", authorize(ROLES.DELIVERY), getDeliveryOrderDetail);

/**
 * @swagger
 * /api/orders/{id}/complete:
 *   patch:
 *     summary: Marcar un pedido en proceso como completado
 *     description: Solo el delivery asignado puede completarlo y solo si está InProgress. Al completarse, el delivery vuelve a estar disponible.
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: Completado }
 *       400: { description: El pedido no está en proceso }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id/complete", authorize(ROLES.DELIVERY), completeOrder);

export default router;
