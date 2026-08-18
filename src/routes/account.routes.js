import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { updateProfileValidator } from "../validators/account.validator.js";
import { getMyProfile, updateMyProfile } from "../controllers/account.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Perfil del usuario autenticado
 */

/**
 * @swagger
 * /api/account/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     tags: [Account]
 *     responses:
 *       200: { description: OK }
 *       401: { description: No autenticado }
 */
router.get("/me", verifyToken, getMyProfile);

/**
 * @swagger
 * /api/account/me:
 *   patch:
 *     summary: Actualizar el perfil del usuario autenticado
 *     tags: [Account]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Actualizado }
 *       401: { description: No autenticado }
 */
router.patch(
  "/me",
  verifyToken,
  upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "logo", maxCount: 1 }]),
  (req, res, next) => {
    // Normaliza el archivo recibido (profileImage o logo) para el controlador
    req.file = req.files?.profileImage?.[0] || req.files?.logo?.[0] || null;
    next();
  },
  updateProfileValidator,
  runValidation,
  updateMyProfile
);

export default router;
