import mongoose from "mongoose";
import { fail } from "../utils/apiResponse.js";

export function notFoundHandler(req, res) {
  return fail(res, { statusCode: 404, message: `Ruta no encontrada: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err instanceof mongoose.Error.CastError) {
    return fail(res, { statusCode: 400, message: `El identificador '${err.value}' no tiene un formato válido.` });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return fail(res, { statusCode: 400, message: "Los datos enviados no son válidos.", errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "campo";
    return fail(res, { statusCode: 409, message: `Ya existe un registro con ese ${field}.` });
  }

  if (err.name === "MulterError" || /Formato de imagen no permitido/.test(err.message)) {
    return fail(res, { statusCode: 400, message: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Ocurrió un error interno en el servidor.";

  return fail(res, { statusCode, message });
}
