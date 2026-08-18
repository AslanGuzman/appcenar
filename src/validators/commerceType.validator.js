import { body } from "express-validator";

export const createCommerceTypeValidator = [
  body("name").notEmpty().withMessage("El nombre es requerido."),
];

export const updateCommerceTypeValidator = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío."),
];
