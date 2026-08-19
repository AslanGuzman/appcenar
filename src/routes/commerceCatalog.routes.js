import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/constants.js";
import {
  getActiveCommerceTypes,
  getCommercesByType,
  getCommerceCatalog,
} from "../controllers/commerceCatalog.controller.js";

const router = Router();

/**
 * @swagger
 * /api/commerce-types:
 *   get:
 *     summary: Listar tipos de comercio para el cliente
 *     description: Devuelve nombre e icono de cada tipo, para el home del cliente.
 *     tags: [Commerce Catalog]
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
router.get("/commerce-types", verifyToken, authorize(ROLES.CLIENT), getActiveCommerceTypes);

/**
 * @swagger
 * /api/commerce:
 *   get:
 *     summary: Listar comercios activos filtrados por tipo
 *     description: Cada comercio incluye isFavorite indicando si el cliente autenticado lo marcó como favorito.
 *     tags: [Commerce Catalog]
 *     parameters:
 *       - name: commerceTypeId
 *         in: query
 *         required: true
 *         description: Tipo de comercio por el cual filtrar
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/Search'
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       400: { description: Falta commerceTypeId }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/commerce", verifyToken, authorize(ROLES.CLIENT), getCommercesByType);

/**
 * @swagger
 * /api/commerce/{commerceId}/catalog:
 *   get:
 *     summary: Obtener el catálogo de un comercio agrupado por categoría
 *     description: Solo se muestran productos activos de un comercio activo.
 *     tags: [Commerce Catalog]
 *     parameters:
 *       - name: commerceId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/commerce/:commerceId/catalog", verifyToken, authorize(ROLES.CLIENT), getCommerceCatalog);

export default router;
