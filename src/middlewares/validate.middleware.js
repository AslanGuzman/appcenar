import { validationResult } from "express-validator";
import { fail } from "../utils/apiResponse.js";

export function runValidation(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return fail(res, {
      statusCode: 400,
      message: "Los datos enviados no son válidos.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  return next();
}
