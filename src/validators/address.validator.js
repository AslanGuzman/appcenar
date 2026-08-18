import { body } from "express-validator";

export const addressValidator = [
  body("label").notEmpty().withMessage("El nombre de la dirección es requerido."),
  body("street").notEmpty().withMessage("La calle es requerida."),
  body("sector").notEmpty().withMessage("El sector es requerido."),
  body("city").notEmpty().withMessage("La ciudad es requerida."),
  body("reference").notEmpty().withMessage("La referencia es requerida."),
];
