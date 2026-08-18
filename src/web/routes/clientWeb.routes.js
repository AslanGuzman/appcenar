import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { requireAuth, requireRole } from "../middlewares/webAuth.middleware.js";
import { ROLES } from "../../utils/constants.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import * as rawClientController from "../controllers/clientWeb.controller.js";

const clientController = wrapControllers(rawClientController);

const router = Router();

// Todo el módulo de cliente requiere haber iniciado sesión como Cliente.
router.use(requireAuth, requireRole(ROLES.CLIENT));

router.get("/home", clientController.home);

router.get("/commerces", clientController.listCommerces);
router.post("/commerces/:commerceId/favorite", clientController.toggleFavorite);

router.get("/catalog/:commerceId", clientController.showCatalog);
router.post("/cart/add", clientController.addToCart);
router.post("/cart/:commerceId/remove/:productId", clientController.removeFromCart);

router.get("/checkout", clientController.showCheckout);
router.post("/checkout", clientController.placeOrder);

router.get("/profile", clientController.showProfile);
router.post("/profile", upload.single("profileImage"), clientController.updateProfile);

router.get("/orders", clientController.listOrders);
router.get("/orders/:id", clientController.showOrderDetail);

router.get("/addresses", clientController.listAddresses);
router.get("/addresses/new", clientController.showNewAddress);
router.post("/addresses", clientController.createAddress);
router.get("/addresses/:id/edit", clientController.showEditAddress);
router.post("/addresses/:id", clientController.updateAddress);
router.get("/addresses/:id/delete", clientController.confirmDeleteAddress);
router.post("/addresses/:id/delete", clientController.deleteAddress);

router.get("/favorites", clientController.listFavorites);
router.post("/favorites/:commerceId/remove", clientController.removeFavorite);

export default router;
