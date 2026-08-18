import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { requireAuth, requireRole } from "../middlewares/webAuth.middleware.js";
import { ROLES } from "../../utils/constants.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import * as rawCommerceController from "../controllers/commerceWeb.controller.js";

const commerceController = wrapControllers(rawCommerceController);

const router = Router();

router.use(requireAuth, requireRole(ROLES.COMMERCE));

router.get("/home", commerceController.home);
router.get("/orders/:id", commerceController.showOrderDetail);
router.post("/orders/:id/assign-delivery", commerceController.assignDelivery);

router.get("/profile", commerceController.showProfile);
router.post("/profile", upload.single("logo"), commerceController.updateProfile);

router.get("/categories", commerceController.listCategories);
router.get("/categories/new", commerceController.showNewCategory);
router.post("/categories", commerceController.createCategory);
router.get("/categories/:id/edit", commerceController.showEditCategory);
router.post("/categories/:id", commerceController.updateCategory);
router.get("/categories/:id/delete", commerceController.confirmDeleteCategory);
router.post("/categories/:id/delete", commerceController.deleteCategory);

router.get("/products", commerceController.listProducts);
router.get("/products/new", commerceController.showNewProduct);
router.post("/products", upload.single("image"), commerceController.createProduct);
router.get("/products/:id/edit", commerceController.showEditProduct);
router.post("/products/:id", upload.single("image"), commerceController.updateProduct);
router.get("/products/:id/delete", commerceController.confirmDeleteProduct);
router.post("/products/:id/delete", commerceController.deleteProduct);

export default router;
