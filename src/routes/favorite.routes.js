import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { addFavoriteValidator, removeFavoriteValidator } from "../validators/favorite.validator.js";
import { listMyFavorites, addFavorite, removeFavorite } from "../controllers/favorite.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.CLIENT));

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Listar mis favoritos
 *     tags: [Favorites]
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/PageSize'
 *       - $ref: '#/components/parameters/SortBy'
 *       - $ref: '#/components/parameters/SortDirection'
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", listMyFavorites);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Agregar comercio a favoritos
 *     description: Solo se permiten comercios existentes y activos. No se admiten duplicados para un mismo cliente.
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [commerceId]
 *             properties:
 *               commerceId: { type: string }
 *     responses:
 *       201: { description: Agregado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: El comercio no existe o no está activo }
 *       409: { description: El comercio ya está en favoritos }
 */
router.post("/", addFavoriteValidator, runValidation, addFavorite);

/**
 * @swagger
 * /api/favorites/{commerceId}:
 *   delete:
 *     summary: Remover comercio de favoritos
 *     tags: [Favorites]
 *     parameters:
 *       - name: commerceId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Removido }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:commerceId", removeFavoriteValidator, runValidation, removeFavorite);

export default router;
