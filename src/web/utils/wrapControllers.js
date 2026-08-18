/**
 * Envuelve todas las funciones de un módulo de controlador para que
 * cualquier error asíncrono no capturado se reenvíe a next(err) en vez
 * de crashear el proceso completo (comportamiento por defecto de Express 4
 * con funciones async: un error sin capturar termina en una promesa
 * rechazada no manejada, que tumba todo el servidor).
 *
 * Con esto, un error como un ObjectId inválido en un solo request
 * termina en la página de error (500) en vez de matar el servidor
 * para todos los usuarios conectados.
 */
export function wrapControllers(controllers) {
  const wrapped = {};

  for (const [key, value] of Object.entries(controllers)) {
    if (typeof value === "function") {
      wrapped[key] = (req, res, next) => {
        Promise.resolve(value(req, res, next)).catch(next);
      };
    } else {
      wrapped[key] = value;
    }
  }

  return wrapped;
}
