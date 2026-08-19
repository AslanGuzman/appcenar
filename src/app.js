import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import { engine } from "express-handlebars";
import swaggerUi from "swagger-ui-express";

import apiRoutes from "./routes/index.js";
import webRoutes from "./web/routes/index.js";
import { swaggerSpec } from "./config/swagger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.middleware.js";
import { exposeLocals } from "./web/middlewares/webAuth.middleware.js";
import { ORDER_STATUS } from "./utils/constants.js";

const app = express();

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "qa") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: { policy: "same-origin" },
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/uploads", express.static(path.resolve("public/uploads")));
app.use(express.static(path.resolve("public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "appcenar-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
      secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "qa",
      sameSite: "lax",
    },
  })
);
app.use(flash());
app.use(exposeLocals);

const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Pendiente",
  [ORDER_STATUS.IN_PROGRESS]: "En proceso",
  [ORDER_STATUS.COMPLETED]: "Completado",
};

const STATUS_CLASSES = {
  [ORDER_STATUS.PENDING]: "status-pending",
  [ORDER_STATUS.IN_PROGRESS]: "status-inprogress",
  [ORDER_STATUS.COMPLETED]: "status-completed",
};

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.resolve("src/views/layouts"),
    partialsDir: path.resolve("src/views/partials"),
    helpers: {
      eq: (a, b) => String(a) === String(b),
      includes: (arr, value) => Array.isArray(arr) && arr.map(String).includes(String(value)),
      formatDate: (date) => (date ? new Date(date).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" }) : ""),
      statusLabel: (status) => STATUS_LABELS[status] || status,
      statusClass: (status) => STATUS_CLASSES[status] || "",
      roleHome: (role) => {
        const map = { Client: "/client/home", Commerce: "/commerce/home", Delivery: "/delivery/home", Admin: "/admin/dashboard" };
        return map[role] || "/auth/login";
      },
      shortId: (id) => (id ? String(id).slice(-6).toUpperCase() : ""),
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.resolve("src/views"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => res.json({ status: "ok", environment: process.env.NODE_ENV }));

app.use("/api", apiRoutes);
app.use("/", webRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return notFoundHandler(req, res);
  return res.status(404).render("404", { title: "No encontrado", layout: "auth" });
});

app.use((err, req, res, next) => {
  if (req.path.startsWith("/api")) return errorHandler(err, req, res, next);

  console.error("[web error]", err);
  return res.status(err.statusCode || 500).render("500", {
    title: "Error",
    layout: "auth",
    message: err.isOperational ? err.message : "Ocurrió un error interno en el servidor.",
  });
});

export default app;
