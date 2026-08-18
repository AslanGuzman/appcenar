import { body } from "express-validator";

export const loginValidator = [
  body("userNameOrEmail").notEmpty().withMessage("El usuario o correo es requerido."),
  body("password").notEmpty().withMessage("La contraseña es requerida."),
];

const baseRegisterValidator = [
  body("firstName").notEmpty().withMessage("El nombre es requerido."),
  body("lastName").notEmpty().withMessage("El apellido es requerido."),
  body("userName").notEmpty().withMessage("El nombre de usuario es requerido."),
  body("email").isEmail().withMessage("El correo no es válido."),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("La contraseña y la confirmación no coinciden.");
    }
    return true;
  }),
  body("phone").notEmpty().withMessage("El teléfono es requerido."),
];

export const registerClientValidator = [...baseRegisterValidator];
export const registerDeliveryValidator = [...baseRegisterValidator];

export const registerCommerceValidator = [
  body("userName").notEmpty().withMessage("El nombre de usuario es requerido."),
  body("email").isEmail().withMessage("El correo no es válido."),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("La contraseña y la confirmación no coinciden.");
    }
    return true;
  }),
  body("name").notEmpty().withMessage("El nombre del comercio es requerido."),
  body("phone").notEmpty().withMessage("El teléfono es requerido."),
  body("openingTime").notEmpty().withMessage("La hora de apertura es requerida."),
  body("closingTime").notEmpty().withMessage("La hora de cierre es requerida."),
  body("commerceTypeId").notEmpty().withMessage("El tipo de comercio es requerido."),
];

export const confirmEmailValidator = [
  body("token").notEmpty().withMessage("El token es requerido."),
];

export const forgotPasswordValidator = [
  body("userNameOrEmail").notEmpty().withMessage("El usuario o correo es requerido."),
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("El token es requerido."),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("La contraseña y la confirmación no coinciden.");
    }
    return true;
  }),
];
