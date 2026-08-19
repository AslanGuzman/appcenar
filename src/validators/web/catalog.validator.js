import { body } from "express-validator";

const requireUploadedFile = (field, message) =>
  body(field).custom((value, { req }) => {
    if (!req.file) {
      throw new Error(message);
    }
    return true;
  });

const productFields = [
  body("name").trim().notEmpty().withMessage("El nombre del producto es requerido."),
  body("description").trim().notEmpty().withMessage("La descripción es requerida."),
  body("price").isFloat({ gt: 0 }).withMessage("El precio debe ser un número mayor a 0."),
  body("categoryId").trim().notEmpty().withMessage("La categoría es requerida."),
];

export const webCreateProductValidator = [
  ...productFields,
  requireUploadedFile("image", "La foto del producto es requerida."),
];

export const webUpdateProductValidator = [...productFields];

const commerceTypeFields = [
  body("name").trim().notEmpty().withMessage("El nombre del tipo de comercio es requerido."),
  body("description").trim().notEmpty().withMessage("La descripción es requerida."),
];

export const webCreateCommerceTypeValidator = [
  ...commerceTypeFields,
  requireUploadedFile("icon", "El ícono del tipo de comercio es requerido."),
];

export const webUpdateCommerceTypeValidator = [...commerceTypeFields];

export const webConfigurationValidator = [
  body("value")
    .trim()
    .notEmpty()
    .withMessage("El valor es requerido.")
    .bail()
    .isFloat({ min: 0, max: 100 })
    .withMessage("El ITBIS debe ser un número entre 0 y 100."),
];
