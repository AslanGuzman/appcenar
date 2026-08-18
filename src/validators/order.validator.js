import { body } from "express-validator";

export const createOrderValidator = [
  body("addressId").notEmpty().withMessage("La dirección es requerida."),
  body("items").isArray({ min: 1 }).withMessage("El pedido debe tener al menos un producto."),
  body("items.*.productId").notEmpty().withMessage("El producto es requerido."),
  body("items.*.quantity")
    .isInt({ gt: 0 })
    .withMessage("La cantidad de cada producto debe ser mayor que 0."),
];
