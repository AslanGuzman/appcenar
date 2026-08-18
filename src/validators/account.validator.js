import { body } from "express-validator";

export const updateProfileValidator = [
  body("firstName").optional().notEmpty().withMessage("El nombre no puede estar vacío."),
  body("lastName").optional().notEmpty().withMessage("El apellido no puede estar vacío."),
  body("phone").optional().notEmpty().withMessage("El teléfono no puede estar vacío."),
  body("email").optional().isEmail().withMessage("El correo no es válido."),
  body("openingTime").optional().notEmpty().withMessage("La hora de apertura no puede estar vacía."),
  body("closingTime").optional().notEmpty().withMessage("La hora de cierre no puede estar vacía."),
];
