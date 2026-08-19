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
 * components:
 *   schemas:
 *     AdministratorInput:
 *       type: object
 *       required: [firstName, lastName, identificationCard, userName, email, password, confirmPassword, phone]
 *       properties:
 *         firstName: { type: string, example: "Juan" }
 *         lastName: { type: string, example: "Pérez" }
 *         identificationCard: { type: string, example: "402-1234567-8" }
 *         userName: { type: string, example: "juan.admin" }
 *         email: { type: string, example: "juan.admin@appcenar.com" }
 *         password: { type: string, example: "P@ssw0rd!" }
 *         confirmPassword: { type: string, example: "P@ssw0rd!" }
 *         phone: { type: string, example: "8090000000" }
 */

/**
 * @swagger
 * /api/admin/users/clients:
 *   get:
 *     summary: Listar clientes
 *     description: Incluye nombre, apellido, cantidad de pedidos, teléfono, correo y estado.
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/IsActive'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/clients", getClients);

/**
 * @swagger
 * /api/admin/users/deliveries:
 *   get:
 *     summary: Listar deliveries
 *     description: Incluye la cantidad de pedidos entregados por cada delivery.
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/IsActive'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/deliveries", getDeliveries);

/**
 * @swagger
 * /api/admin/users/commerces:
 *   get:
 *     summary: Listar comercios
 *     description: Incluye nombre, logo, cantidad de pedidos, teléfono, horario, correo y estado.
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/IsActive'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/commerces", getCommerces);

/**
 * @swagger
 * /api/admin/users/admins:
 *   get:
 *     summary: Listar administradores
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/IsActive'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/admins", getAdministrators);

/**
 * @swagger
 * /api/admin/users/admins:
 *   post:
 *     summary: Crear administrador
 *     description: El administrador se crea activo. userName y email deben ser únicos en todo el sistema.
 *     tags: [Admin Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AdministratorInput' }
 *     responses:
 *       201: { description: Creado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post("/admins", createAdminValidator, runValidation, createAdministrator);

/**
 * @swagger
 * /api/admin/users/admins/{id}:
 *   put:
 *     summary: Actualizar administrador
 *     description: El admin autenticado no puede editarse a sí mismo y el admin por defecto no puede ser modificado.
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               identificationCard: { type: string }
 *               userName: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: No permitido (auto-edición o admin por defecto) }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/admins/:id", updateAdminValidator, runValidation, updateAdministrator);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Activar o inactivar un usuario
 *     description: Aplica a client, delivery, commerce y administradores editables. El admin autenticado no puede cambiar su propio estado ni el del admin por defecto.
 *     tags: [Admin Users]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { description: No permitido (usuario autenticado o admin por defecto) }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id/status", updateStatusValidator, runValidation, updateUserStatus);

export default router;
