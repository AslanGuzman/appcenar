import { Router } from "express";
import { upload } from "../../middlewares/upload.middleware.js";
import { redirectIfAuthenticated } from "../middlewares/webAuth.middleware.js";
import { runWebValidation } from "../middlewares/webValidate.middleware.js";
import { wrapControllers } from "../utils/wrapControllers.js";
import { loginValidator, forgotPasswordValidator } from "../../validators/auth.validator.js";
import {
  webRegisterUserValidator,
  webRegisterCommerceValidator,
  webResetPasswordValidator,
} from "../../validators/web/auth.validator.js";
import * as rawAuthController from "../controllers/authWeb.controller.js";

const authController = wrapControllers(rawAuthController);

const router = Router();

router.get("/login", redirectIfAuthenticated, authController.showLogin);
router.post("/login", loginValidator, runWebValidation("/auth/login"), authController.login);
router.post("/logout", authController.logout);

router.get("/register", redirectIfAuthenticated, authController.showRegister);
router.post(
  "/register",
  upload.single("profileImage"),
  webRegisterUserValidator,
  runWebValidation("/auth/register"),
  authController.register
);

router.get("/register-commerce", redirectIfAuthenticated, authController.showRegisterCommerce);
router.post(
  "/register-commerce",
  upload.single("logo"),
  webRegisterCommerceValidator,
  runWebValidation("/auth/register-commerce"),
  authController.registerCommerce
);

router.get("/activate/:token", authController.activateAccount);

router.get("/forgot-password", redirectIfAuthenticated, authController.showForgotPassword);
router.post(
  "/forgot-password",
  forgotPasswordValidator,
  runWebValidation("/auth/forgot-password"),
  authController.forgotPassword
);

router.get("/reset-password", redirectIfAuthenticated, authController.showResetPassword);
router.post(
  "/reset-password",
  webResetPasswordValidator,
  runWebValidation((req) => `/auth/reset-password?token=${req.body.token || ""}`),
  authController.resetPassword
);

export default router;
