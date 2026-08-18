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
 * tags:
 *   name: Addresses
 *   description: Direcciones del cliente
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Listar mis direcciones
 *     tags: [Addresses]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", listMyAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Obtener dirección por id
 *     tags: [Addresses]
 *     responses:
 *       200: { description: OK }
 */
router.get("/:id", getAddressById);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Crear dirección
 *     tags: [Addresses]
 *     responses:
 *       201: { description: Creado }
 */
router.post("/", addressValidator, runValidation, createAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Actualizar dirección
 *     tags: [Addresses]
 *     responses:
 *       200: { description: Actualizado }
 */
router.put("/:id", addressValidator, runValidation, updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Eliminar dirección
 *     tags: [Addresses]
 *     responses:
 *       200: { description: Eliminado }
 */
router.delete("/:id", deleteAddress);

export default router;
