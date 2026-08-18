import { Router } from "express";
import authWebRoutes from "./authWeb.routes.js";
import clientWebRoutes from "./clientWeb.routes.js";
import commerceWebRoutes from "./commerceWeb.routes.js";
import deliveryWebRoutes from "./deliveryWeb.routes.js";
import adminWebRoutes from "./adminWeb.routes.js";
import { getRoleHome } from "../middlewares/webAuth.middleware.js";

const router = Router();

router.get("/", (req, res) => {
  if (req.session?.user) {
    return res.redirect(getRoleHome(req.session.user.role));
  }
  return res.redirect("/auth/login");
});

router.use("/auth", authWebRoutes);
router.use("/client", clientWebRoutes);
router.use("/commerce", commerceWebRoutes);
router.use("/delivery", deliveryWebRoutes);
router.use("/admin", adminWebRoutes);

export default router;
