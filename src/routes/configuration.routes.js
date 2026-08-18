import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { updateConfigurationValidator } from "../validators/configuration.validator.js";
import {
  getConfigurations,
  getConfigurationByKey,
  updateConfiguration,
} from "../controllers/configuration.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.ADMIN));

/**
 * @swagger
 * tags:
 *   name: Configurations
 *   description: Configuraciones del sistema (ITBIS, etc.)
 */

/**
 * @swagger
 * /api/configurations:
 *   get:
 *     summary: Listar configuraciones
 *     tags: [Configurations]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", getConfigurations);

/**
 * @swagger
 * /api/configurations/{key}:
 *   get:
 *     summary: Obtener configuración por key
 *     tags: [Configurations]
 *     responses:
 *       200: { description: OK }
 *       404: { description: No encontrada }
 */
router.get("/:key", getConfigurationByKey);

/**
 * @swagger
 * /api/configurations/{key}:
 *   put:
 *     summary: Actualizar configuración
 *     tags: [Configurations]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: string }
 *     responses:
 *       200: { description: Actualizado }
 */
router.put("/:key", updateConfigurationValidator, runValidation, updateConfiguration);

export default router;
