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
 * /api/products:
 *   get:
 *     summary: Listar mis productos
 *     description: Devuelve los productos del comercio autenticado.
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *       - name: categoryId
 *         in: query
 *         description: Filtrar por categoría
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", listMyProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por id
 *     description: Solo devuelve productos del comercio autenticado.
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear producto
 *     description: Todos los campos son requeridos, incluida la imagen. categoryId debe pertenecer al comercio autenticado.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, description, price, categoryId, image]
 *             properties:
 *               name: { type: string, example: "Pizza margarita" }
 *               description: { type: string, example: "Pizza con salsa de tomate y queso" }
 *               price: { type: number, example: 450 }
 *               categoryId: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/", upload.single("image"), createProductValidator, runValidation, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     description: La imagen es opcional al editar; si no se envía, se conserva la actual.
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
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
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id", upload.single("image"), updateProductValidator, runValidation, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Products]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: Eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", deleteProduct);

export default router;
