import { body, param } from "express-validator";

export const addFavoriteValidator = [
  body("commerceId")
    .notEmpty()
    .withMessage("El comercio es requerido.")
    .bail()
    .isMongoId()
    .withMessage("El identificador del comercio no es válido."),
];

export const removeFavoriteValidator = [
  param("commerceId").isMongoId().withMessage("El identificador del comercio no es válido."),
];
