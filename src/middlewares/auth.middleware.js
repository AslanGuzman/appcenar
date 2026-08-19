import jwt from "jsonwebtoken";
import { fail } from "../utils/apiResponse.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, { statusCode: 401, message: "No se proporcionó un token de autenticación." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, userName, email }
    return next();
  } catch (err) {
    return fail(res, { statusCode: 401, message: "Token inválido o expirado." });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return fail(res, { statusCode: 401, message: "No se proporcionó un token de autenticación." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, { statusCode: 403, message: "No tienes permisos para acceder a este recurso." });
    }

    return next();
  };
}
