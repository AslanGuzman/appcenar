import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { requireAuth, requireRole } from "../middlewares/webAuth.middleware.js";
import { ROLES } from "../../utils/constants.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import * as rawAdminController from "../controllers/adminWeb.controller.js";

const adminController = wrapControllers(rawAdminController);

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get("/dashboard", adminController.dashboard);

router.get("/clients", adminController.listClients);
router.get("/deliveries", adminController.listDeliveries);
router.get("/commerces", adminController.listCommerces);
router.post("/users/:id/toggle-status", adminController.toggleUserStatus);

router.get("/configuration", adminController.showConfiguration);
router.post("/configuration", adminController.updateConfiguration);

router.get("/administrators", adminController.listAdministrators);
router.get("/administrators/new", adminController.showNewAdministrator);
router.post("/administrators", adminController.createAdministrator);
router.get("/administrators/:id/edit", adminController.showEditAdministrator);
router.post("/administrators/:id", adminController.updateAdministrator);
router.get("/administrators/:id/toggle", adminController.confirmToggleAdministrator);
router.post("/administrators/:id/toggle", adminController.toggleUserStatus);

router.get("/commerce-types", adminController.listCommerceTypes);
router.get("/commerce-types/new", adminController.showNewCommerceType);
router.post("/commerce-types", upload.single("icon"), adminController.createCommerceType);
router.get("/commerce-types/:id/edit", adminController.showEditCommerceType);
router.post("/commerce-types/:id", upload.single("icon"), adminController.updateCommerceType);
router.get("/commerce-types/:id/delete", adminController.confirmDeleteCommerceType);
router.post("/commerce-types/:id/delete", adminController.deleteCommerceType);

export default router;
