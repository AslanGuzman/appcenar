import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { requireAuth, requireRole } from "../middlewares/webAuth.middleware.js";
import { ROLES } from "../../utils/constants.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import * as rawDeliveryController from "../controllers/deliveryWeb.controller.js";

const deliveryController = wrapControllers(rawDeliveryController);

const router = Router();

router.use(requireAuth, requireRole(ROLES.DELIVERY));

router.get("/home", deliveryController.home);
router.get("/orders/:id", deliveryController.showOrderDetail);
router.post("/orders/:id/complete", deliveryController.completeOrder);

router.get("/profile", deliveryController.showProfile);
router.post("/profile", upload.single("profileImage"), deliveryController.updateProfile);

export default router;
