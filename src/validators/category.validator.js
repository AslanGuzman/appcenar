import { body } from "express-validator";

export const categoryValidator = [
  body("name").notEmpty().withMessage("El nombre de la categoría es requerido."),
  body("description").notEmpty().withMessage("La descripción es requerida."),
];
