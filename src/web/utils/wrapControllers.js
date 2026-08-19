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
