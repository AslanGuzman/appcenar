import { validationResult } from "express-validator";
import { flashFormData } from "../utils/formData.js";

export function runWebValidation(redirectTo) {
  return (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    errors.array().forEach((error) => req.flash("errors", error.msg));
    flashFormData(req);

    const target = typeof redirectTo === "function" ? redirectTo(req) : redirectTo;
    return res.redirect(target);
  };
}
