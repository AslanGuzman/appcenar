import { body } from "express-validator";

export const webUserProfileValidator = [
  body("firstName").trim().notEmpty().withMessage("El nombre es requerido."),
  body("lastName").trim().notEmpty().withMessage("El apellido es requerido."),
  body("phone").trim().notEmpty().withMessage("El teléfono es requerido."),
];

export const webCommerceProfileValidator = [
  body("email").trim().isEmail().withMessage("El correo no es válido."),
  body("phone").trim().notEmpty().withMessage("El teléfono es requerido."),
  body("openingTime").trim().notEmpty().withMessage("La hora de apertura es requerida."),
  body("closingTime").trim().notEmpty().withMessage("La hora de cierre es requerida."),
];
