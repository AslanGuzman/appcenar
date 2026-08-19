import { Router } from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { runValidation } from "../middlewares/validate.middleware.js";
import {
  loginValidator,
  registerClientValidator,
  registerDeliveryValidator,
  registerCommerceValidator,
  confirmEmailValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";
import {
  login,
  registerClient,
  registerDelivery,
  registerCommerce,
  confirmEmail,
  confirmEmailFromLink,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión con userName o email y password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userNameOrEmail, password]
 *             properties:
 *               userNameOrEmail: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Autenticación exitosa }
 *       400: { description: Faltan campos requeridos }
 *       401: { description: Credenciales inválidas o cuenta inactiva }
 */
router.post("/login", loginValidator, runValidation, login);

/**
 * @swagger
 * /api/auth/register-client:
 *   post:
 *     summary: Registrar un usuario con rol Client
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               userName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *               phone: { type: string }
 *               profileImage: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Datos inválidos }
 *       409: { description: userName o email ya existen }
 */
router.post(
  "/register-client",
  upload.single("profileImage"),
  registerClientValidator,
  runValidation,
  registerClient
);

/**
 * @swagger
 * /api/auth/register-delivery:
 *   post:
 *     summary: Registrar un usuario con rol Delivery
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               userName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *               phone: { type: string }
 *               profileImage: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Datos inválidos }
 *       409: { description: userName o email ya existen }
 */
router.post(
  "/register-delivery",
  upload.single("profileImage"),
  registerDeliveryValidator,
  runValidation,
  registerDelivery
);

/**
 * @swagger
 * /api/auth/register-commerce:
 *   post:
 *     summary: Registrar un usuario con rol Commerce y su perfil de comercio
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *               name: { type: string }
 *               description: { type: string }
 *               phone: { type: string }
 *               openingTime: { type: string }
 *               closingTime: { type: string }
 *               commerceTypeId: { type: string }
 *               logo: { type: string, format: binary }
 *     responses:
 *       201: { description: Creado }
 *       400: { description: Datos inválidos }
 *       409: { description: userName o email ya existen }
 */
router.post(
  "/register-commerce",
  upload.single("logo"),
  registerCommerceValidator,
  runValidation,
  registerCommerce
);

/**
 * @swagger
 * /api/auth/confirm-email:
 *   post:
 *     summary: Confirmar cuenta usando el token de activación
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Cuenta activada }
 *       400: { description: Token inválido o expirado }
 *       404: { description: Token no encontrado }
 */
router.post("/confirm-email", confirmEmailValidator, runValidation, confirmEmail);

/**
 * Endpoint público pensado para ser abierto desde el enlace del correo de
 * activación (los clientes de correo/navegadores solo pueden seguir enlaces
 * GET). Muestra una página HTML de confirmación en vez de JSON.
 */
router.get("/confirm-email", confirmEmailFromLink);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userNameOrEmail]
 *             properties:
 *               userNameOrEmail: { type: string }
 *     responses:
 *       200: { description: Correo enviado si el usuario existe }
 *       400: { description: Datos inválidos }
 */
router.post("/forgot-password", forgotPasswordValidator, runValidation, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña usando el token recibido por correo
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, confirmPassword]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Token inválido, expirado o datos inválidos }
 */
router.post("/reset-password", resetPasswordValidator, runValidation, resetPassword);

export default router;
