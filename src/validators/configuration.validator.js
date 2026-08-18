import { body } from "express-validator";

export const updateConfigurationValidator = [
  body("value").notEmpty().withMessage("El valor de la configuración es requerido."),
];
