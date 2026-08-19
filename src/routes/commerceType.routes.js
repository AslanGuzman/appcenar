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
 * /api/admin/commerce-types:
 *   get:
 *     summary: Listar tipos de comercio
 *     description: Cada tipo incluye commerceCount con la cantidad de comercios asociados.
 *     tags: [Commerce Types]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", listCommerceTypes);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   get:
 *     summary: Obtener tipo de comercio por id
 *     tags: [Commerce Types]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", getCommerceTypeById);

/**
 * @swagger
 * /api/admin/commerce-types:
 *   post:
 *     summary: Crear tipo de comercio
 *     description: El nombre y el icono son requeridos. El icono se envia en el mismo endpoint.
 *     tags: [Commerce Types]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, icon]
 *             properties:
 *               name: { type: string, example: "Restaurantes" }
 *               description: { type: string, example: "Comida preparada a domicilio" }
 *               icon: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: Ya existe un tipo con ese nombre }
 */
router.post("/", upload.single("icon"), createCommerceTypeValidator, runValidation, createCommerceType);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   put:
 *     summary: Actualizar tipo de comercio
 *     description: El icono es opcional al editar; si no se envia, se conserva el actual.
 *     tags: [Commerce Types]
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
 *               icon: { type: string, format: binary }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Ya existe un tipo con ese nombre }
 */
router.put("/:id", upload.single("icon"), updateCommerceTypeValidator, runValidation, updateCommerceType);

/**
 * @swagger
 * /api/admin/commerce-types/{id}:
 *   delete:
 *     summary: Eliminar tipo de comercio en cascada
 *     description: >
 *       Eliminacion fisica en cascada: borra el tipo, sus comercios y los usuarios de esos comercios,
 *       junto con sus categorias, productos, pedidos y favoritos asociados.
 *     tags: [Commerce Types]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: Eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", deleteCommerceType);

export default router;
