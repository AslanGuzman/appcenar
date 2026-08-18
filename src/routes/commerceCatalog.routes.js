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
 * tags:
 *   name: Commerce Catalog
 *   description: Catálogo de comercios visible para el cliente
 */

/**
 * @swagger
 * /api/commerce-types:
 *   get:
 *     summary: Listar tipos de comercio activos (para el cliente)
 *     tags: [Commerce Catalog]
 *     responses:
 *       200: { description: OK }
 */
router.get("/commerce-types", verifyToken, authorize(ROLES.CLIENT), getActiveCommerceTypes);

/**
 * @swagger
 * /api/commerce:
 *   get:
 *     summary: Listar comercios activos filtrados por tipo
 *     tags: [Commerce Catalog]
 *     parameters:
 *       - in: query
 *         name: commerceTypeId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get("/commerce", verifyToken, authorize(ROLES.CLIENT), getCommercesByType);

/**
 * @swagger
 * /api/commerce/{commerceId}/catalog:
 *   get:
 *     summary: Obtener el catálogo de productos de un comercio agrupado por categoría
 *     tags: [Commerce Catalog]
 *     parameters:
 *       - in: path
 *         name: commerceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrado }
 */
router.get("/commerce/:commerceId/catalog", verifyToken, authorize(ROLES.CLIENT), getCommerceCatalog);

export default router;
