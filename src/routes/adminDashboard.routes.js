import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/constants.js";
import { getDashboard } from "../controllers/adminDashboard.controller.js";

const router = Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener metricas del dashboard
 *     description: Total de pedidos y pedidos del dia, comercios/clientes/deliveries activos e inactivos, y total de productos creados.
 *     tags: [Admin Dashboard]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: object
 *                           properties:
 *                             total: { type: integer, example: 2500 }
 *                             today: { type: integer, example: 18 }
 *                         commerces:
 *                           type: object
 *                           properties:
 *                             active: { type: integer, example: 120 }
 *                             inactive: { type: integer, example: 8 }
 *                         clients:
 *                           type: object
 *                           properties:
 *                             active: { type: integer, example: 980 }
 *                             inactive: { type: integer, example: 35 }
 *                         deliveries:
 *                           type: object
 *                           properties:
 *                             active: { type: integer, example: 76 }
 *                             inactive: { type: integer, example: 6 }
 *                         products:
 *                           type: object
 *                           properties:
 *                             total: { type: integer, example: 4120 }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", verifyToken, authorize(ROLES.ADMIN), getDashboard);

export default router;
