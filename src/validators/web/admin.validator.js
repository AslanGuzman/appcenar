import { body } from "express-validator";

const administratorFields = [
  body("firstName").trim().notEmpty().withMessage("El nombre es requerido."),
  body("lastName").trim().notEmpty().withMessage("El apellido es requerido."),
  body("identificationCard").trim().notEmpty().withMessage("La cédula es requerida."),
  body("userName").trim().notEmpty().withMessage("El nombre de usuario es requerido."),
  body("email").trim().isEmail().withMessage("El correo no es válido."),
  body("phone").trim().notEmpty().withMessage("El teléfono es requerido."),
];

const matchesConfirmation = body("confirmPassword").custom((value, { req }) => {
  if (value !== req.body.password) {
    throw new Error("La contraseña y la confirmación no coinciden.");
  }
  return true;
});

export const webCreateAdministratorValidator = [
  ...administratorFields,
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  matchesConfirmation,
];

export const webUpdateAdministratorValidator = [
  ...administratorFields,
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres."),
  matchesConfirmation,
];
