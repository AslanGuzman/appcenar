/**
 * Error de aplicación con código HTTP asociado.
 * Se usa en controladores/servicios para lanzar errores esperados
 * (validaciones de negocio, recursos no encontrados, conflictos, etc.)
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
