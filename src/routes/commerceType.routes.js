import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import {
  createCommerceTypeValidator,
  updateCommerceTypeValidator,
} from "../validators/commerceType.validator.js";
import {
  listCommerceTypes,
  getCommerceTypeById,
  createCommerceType,
  updateCommerceType,
  deleteCommerceType,
} from "../controllers/commerceType.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.ADMIN));

/**
 * @swagger
 * tags:
 *   name: Commerce Types (Admin)
 *   description: Mantenimiento de tipos de comercio
 */

/**
 * @swagger
 * /api/admin/commerce-types:
 *   get:
 *     summary: Listar tipos de comercio
 *     tags: [Commerce Types (Admin)]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", listCommerceTypes);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   get:
 *     summary: Obtener tipo de comercio por id
 *     tags: [Commerce Types (Admin)]
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrado }
 */
router.get("/:id", getCommerceTypeById);

/**
 * @swagger
 * /api/admin/commerce-types:
 *   post:
 *     summary: Crear tipo de comercio
 *     tags: [Commerce Types (Admin)]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               icon: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 */
router.post("/", upload.single("icon"), createCommerceTypeValidator, runValidation, createCommerceType);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   put:
 *     summary: Actualizar tipo de comercio
 *     tags: [Commerce Types (Admin)]
 *     responses:
 *       200: { description: Actualizado }
 */
router.put("/:id", upload.single("icon"), updateCommerceTypeValidator, runValidation, updateCommerceType);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   delete:
 *     summary: Eliminar tipo de comercio (hard delete en cascada)
 *     tags: [Commerce Types (Admin)]
 *     responses:
 *       200: { description: Eliminado }
 */
router.delete("/:id", deleteCommerceType);

export default router;
