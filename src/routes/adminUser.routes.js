import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import {
  createAdminValidator,
  updateAdminValidator,
  updateStatusValidator,
} from "../validators/adminUser.validator.js";
import {
  getClients,
  getDeliveries,
  getCommerces,
  getAdministrators,
  createAdministrator,
  updateAdministrator,
  updateUserStatus,
} from "../controllers/adminUser.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.ADMIN));

/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: Administración de usuarios del sistema
 */

/**
 * @swagger
 * /api/admin/users/clients:
 *   get:
 *     summary: Listar clientes
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/clients", getClients);

/**
 * @swagger
 * /api/admin/users/deliveries:
 *   get:
 *     summary: Listar deliveries
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/deliveries", getDeliveries);

/**
 * @swagger
 * /api/admin/users/commerces:
 *   get:
 *     summary: Listar comercios
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/commerces", getCommerces);

/**
 * @swagger
 * /api/admin/users/admins:
 *   get:
 *     summary: Listar administradores
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: OK }
 */
router.get("/admins", getAdministrators);

/**
 * @swagger
 * /api/admin/users/admins:
 *   post:
 *     summary: Crear administrador
 *     tags: [Admin Users]
 *     responses:
 *       201: { description: Creado }
 */
router.post("/admins", createAdminValidator, runValidation, createAdministrator);

/**
 * @swagger
 * /api/admin/users/admins/{id}:
 *   put:
 *     summary: Actualizar administrador
 *     tags: [Admin Users]
 *     responses:
 *       200: { description: Actualizado }
 *       403: { description: No permitido (auto-edición o admin por defecto) }
 */
router.put("/admins/:id", updateAdminValidator, runValidation, updateAdministrator);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Activar/inactivar un usuario (client, delivery, commerce o admin)
 *     tags: [Admin Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200: { description: Actualizado }
 *       403: { description: No permitido (auto-edición o admin por defecto) }
 */
router.patch("/:id/status", updateStatusValidator, runValidation, updateUserStatus);

export default router;
