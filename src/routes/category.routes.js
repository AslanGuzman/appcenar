import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { categoryValidator } from "../validators/category.validator.js";
import {
  listMyCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.COMMERCE));

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Mantenimiento de categorías del comercio
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Listar mis categorías
 *     tags: [Categories]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", listMyCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener categoría por id
 *     tags: [Categories]
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear categoría
 *     tags: [Categories]
 *     responses:
 *       201: { description: Creado }
 */
router.post("/", categoryValidator, runValidation, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categories]
 *     responses:
 *       200: { description: Actualizado }
 */
router.put("/:id", categoryValidator, runValidation, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categories]
 *     responses:
 *       200: { description: Eliminado }
 */
router.delete("/:id", deleteCategory);

export default router;
