import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/constants.js";
import { listMyFavorites, addFavorite, removeFavorite } from "../controllers/favorite.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.CLIENT));

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Comercios favoritos del cliente
 */

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Listar mis favoritos
 *     tags: [Favorites]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", listMyFavorites);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: Agregar comercio a favoritos
 *     tags: [Favorites]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commerceId: { type: string }
 *     responses:
 *       201: { description: Agregado }
 *       409: { description: Ya existe }
 */
router.post("/", addFavorite);

/**
 * @swagger
 * /api/favorites/{commerceId}:
 *   delete:
 *     summary: Remover comercio de favoritos
 *     tags: [Favorites]
 *     responses:
 *       200: { description: Removido }
 */
router.delete("/:commerceId", removeFavorite);

export default router;
