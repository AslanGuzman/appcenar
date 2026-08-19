import { Router } from "express";

import authRoutes from "./auth.routes.js";
import accountRoutes from "./account.routes.js";
import commerceCatalogRoutes from "./commerceCatalog.routes.js";
import orderRoutes from "./order.routes.js";
import addressRoutes from "./address.routes.js";
import favoriteRoutes from "./favorite.routes.js";
import categoryRoutes from "./category.routes.js";
import productRoutes from "./product.routes.js";
import adminDashboardRoutes from "./adminDashboard.routes.js";
import adminUserRoutes from "./adminUser.routes.js";
import configurationRoutes from "./configuration.routes.js";
import commerceTypeRoutes from "./commerceType.routes.js";

const router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Información general de la API
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200: { description: OK }
 */
router.get("/", (req, res) =>
  res.json({
    success: true,
    message: "AppCenar API",
    docs: "/api-docs",
    health: "/health",
  })
);

router.use("/auth", authRoutes);
router.use("/account", accountRoutes);

router.use("/", commerceCatalogRoutes);

router.use("/orders", orderRoutes);
router.use("/addresses", addressRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);

router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/commerce-types", commerceTypeRoutes);

router.use("/configurations", configurationRoutes);

export default router;
