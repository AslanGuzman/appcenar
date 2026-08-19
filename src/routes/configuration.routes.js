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
 * /api/configurations:
 *   get:
 *     summary: Listar configuraciones
 *     description: El sistema garantiza que exista al menos la configuración ITBIS.
 *     tags: [Configurations]
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", getConfigurations);

/**
 * @swagger
 * /api/configurations/{key}:
 *   get:
 *     summary: Obtener configuración por key
 *     tags: [Configurations]
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Clave de la configuración
 *         schema: { type: string, example: "ITBIS" }
 *     responses:
 *       200: { description: OK }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:key", getConfigurationByKey);

/**
 * @swagger
 * /api/configurations/{key}:
 *   put:
 *     summary: Actualizar configuración
 *     description: El valor debe corresponder al tipo esperado. El ITBIS vigente se usa al calcular el total de los pedidos.
 *     tags: [Configurations]
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Clave de la configuración
 *         schema: { type: string, example: "ITBIS" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value: { type: string, example: "18" }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { description: El valor no corresponde al tipo esperado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:key", updateConfigurationValidator, runValidation, updateConfiguration);

export default router;
