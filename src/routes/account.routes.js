import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { updateProfileValidator } from "../validators/account.validator.js";
import { getMyProfile, updateMyProfile } from "../controllers/account.controller.js";

const router = Router();

/**
 * @swagger
 * /api/account/me:
 *   get:
 *     summary: Obtener el perfil del usuario autenticado
 *     description: >
 *       El contenido depende del rol. Para Commerce incluye ademas los datos del comercio relacionado;
 *       para Delivery incluye el indicador isAvailable.
 *     tags: [Account]
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/me", verifyToken, getMyProfile);

/**
 * @swagger
 * /api/account/me:
 *   patch:
 *     summary: Actualizar el perfil del usuario autenticado
 *     description: >
 *       Client y Delivery envian firstName, lastName, phone y profileImage (opcional).
 *       Commerce envia email, phone, openingTime, closingTime y logo (opcional).
 *     tags: [Account]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               profileImage: { type: string, format: binary }
 *               email: { type: string }
 *               openingTime: { type: string, example: "08:00" }
 *               closingTime: { type: string, example: "22:00" }
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/me",
  verifyToken,
  upload.fields([{ name: "profileImage", maxCount: 1 }, { name: "logo", maxCount: 1 }]),
  (req, res, next) => {
    req.file = req.files?.profileImage?.[0] || req.files?.logo?.[0] || null;
    next();
  },
  updateProfileValidator,
  runValidation,
  updateMyProfile
);

export default router;
