import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { createProductValidator, updateProductValidator } from "../validators/product.validator.js";
import {
  listMyProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.COMMERCE));

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Mantenimiento de productos del comercio
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar mis productos
 *     tags: [Products]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", listMyProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por id
 *     tags: [Products]
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear producto
 *     tags: [Products]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               categoryId: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 */
router.post("/", upload.single("image"), createProductValidator, runValidation, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto (imagen opcional)
 *     tags: [Products]
 *     responses:
 *       200: { description: Actualizado }
 */
router.put("/:id", upload.single("image"), updateProductValidator, runValidation, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
 *     responses:
 *       200: { description: Eliminado }
 */
router.delete("/:id", deleteProduct);

export default router;
