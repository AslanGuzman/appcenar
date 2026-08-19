import { Router } from "express";
import { verifyToken, authorize } from "../middlewares/auth.middleware.js";
import { ROLES } from "../utils/constants.js";
import { getDashboard } from "../controllers/adminDashboard.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Métricas generales del sistema
 */

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Obtener métricas del dashboard
 *     tags: [Admin Dashboard]
 *     responses:
 *       200: { description: OK }
 */
router.get("/", verifyToken, authorize(ROLES.ADMIN), getDashboard);

export default router;
