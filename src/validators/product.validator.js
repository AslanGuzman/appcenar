import { body } from "express-validator";

export const createProductValidator = [
  body("name").notEmpty().withMessage("El nombre del producto es requerido."),
  body("description").notEmpty().withMessage("La descripción es requerida."),
  body("price").isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor a 0."),
  body("categoryId").notEmpty().withMessage("La categoría es requerida."),
];

export const updateProductValidator = [
  body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío."),
  body("description").optional().notEmpty().withMessage("La descripción no puede estar vacía."),
  body("price").optional().isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor a 0."),
  body("categoryId").optional().notEmpty().withMessage("La categoría no puede estar vacía."),
];
