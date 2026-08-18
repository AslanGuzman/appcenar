import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { redirectIfAuthenticated } from "../middlewares/webAuth.middleware.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import * as rawAuthController from "../controllers/authWeb.controller.js";

const authController = wrapControllers(rawAuthController);

const router = Router();

router.get("/login", redirectIfAuthenticated, authController.showLogin);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.get("/register", redirectIfAuthenticated, authController.showRegister);
router.post("/register", upload.single("profileImage"), authController.register);

router.get("/register-commerce", redirectIfAuthenticated, authController.showRegisterCommerce);
router.post("/register-commerce", upload.single("logo"), authController.registerCommerce);

router.get("/activate/:token", authController.activateAccount);

router.get("/forgot-password", redirectIfAuthenticated, authController.showForgotPassword);
router.post("/forgot-password", authController.forgotPassword);

router.get("/reset-password", redirectIfAuthenticated, authController.showResetPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
