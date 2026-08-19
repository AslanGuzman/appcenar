import { body } from "express-validator";

export const createAdminValidator = [
  body("firstName").notEmpty().withMessage("El nombre es requerido."),
  body("lastName").notEmpty().withMessage("El apellido es requerido."),
  body("identificationCard").notEmpty().withMessage("La cédula es requerida."),
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

export const updateAdminValidator = [
  body("firstName").optional().notEmpty(),
  body("lastName").optional().notEmpty(),
  body("identificationCard").optional().notEmpty(),
  body("userName").optional().notEmpty(),
  body("email").optional().isEmail(),
  body("phone").optional().notEmpty(),
];

export const updateStatusValidator = [
  body("isActive").isBoolean().withMessage("isActive debe ser un valor booleano."),
];
