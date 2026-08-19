import { body } from "express-validator";
import { ROLES } from "../../utils/constants.js";

const passwordRules = (field = "password") => [
  body(field).isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body[field]) {
      throw new Error("La contraseña y la confirmación no coinciden.");
    }
    return true;
  }),
];

export const webRegisterUserValidator = [
  body("firstName").trim().notEmpty().withMessage("El nombre es requerido."),
  body("lastName").trim().notEmpty().withMessage("El apellido es requerido."),
  body("userName").trim().notEmpty().withMessage("El nombre de usuario es requerido."),
  body("email").trim().isEmail().withMessage("El correo no es válido."),
  body("phone").trim().notEmpty().withMessage("El teléfono es requerido."),
  body("role")
    .isIn([ROLES.CLIENT, ROLES.DELIVERY])
    .withMessage("Debes seleccionar si te registras como cliente o delivery."),
  ...passwordRules(),
];

export const webRegisterCommerceValidator = [
  body("name").trim().notEmpty().withMessage("El nombre del comercio es requerido."),
  body("userName").trim().notEmpty().withMessage("El nombre de usuario es requerido."),
  body("email").trim().isEmail().withMessage("El correo no es válido."),
  body("phone").trim().notEmpty().withMessage("El teléfono es requerido."),
  body("openingTime").trim().notEmpty().withMessage("La hora de apertura es requerida."),
  body("closingTime").trim().notEmpty().withMessage("La hora de cierre es requerida."),
  body("commerceTypeId").trim().notEmpty().withMessage("El tipo de comercio es requerido."),
  ...passwordRules(),
];

export const webResetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("El enlace de recuperación no es válido."),
  ...passwordRules(),
];
