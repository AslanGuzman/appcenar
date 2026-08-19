import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import { ROLES } from "../utils/constants.js";
import { addressValidator } from "../validators/address.validator.js";
import {
  listMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

const router = Router();

router.use(verifyToken, authorize(ROLES.CLIENT));

/**
 * @swagger
 * components:
 *   schemas:
 *     AddressInput:
 *       type: object
 *       required: [label, street, sector, city, reference]
 *       properties:
 *         label: { type: string, example: "Casa" }
 *         street: { type: string, example: "Calle 27 #10" }
 *         sector: { type: string, example: "Mirador Norte" }
 *         city: { type: string, example: "Santo Domingo" }
 *         reference: { type: string, example: "Apt 3B" }
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Listar mis direcciones
 *     description: Devuelve las direcciones del cliente autenticado, paginadas.
 *     tags: [Addresses]
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
router.get("/", listMyAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Obtener dirección por id
 *     description: Solo devuelve direcciones que pertenecen al cliente autenticado.
 *     tags: [Addresses]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: OK }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", getAddressById);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Crear dirección
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddressInput' }
 *     responses:
 *       201: { description: Creado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/", addressValidator, runValidation, createAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Actualizar dirección
 *     tags: [Addresses]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AddressInput' }
 *     responses:
 *       200: { description: Actualizado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:id", addressValidator, runValidation, updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Eliminar dirección
 *     tags: [Addresses]
 *     parameters:
 *       - $ref: '#/components/parameters/Id'
 *     responses:
 *       200: { description: Eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", deleteAddress);

export default router;
