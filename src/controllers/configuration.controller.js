import { Configuration } from "../models/Configuration.js";
import { success, fail } from "../utils/apiResponse.js";

export async function getConfigurations(req, res, next) {
  try {
    const configurations = await Configuration.find().sort({ key: 1 });
    return success(res, { data: configurations });
  } catch (err) {
    return next(err);
  }
}

export async function getConfigurationByKey(req, res, next) {
  try {
    const configuration = await Configuration.findOne({ key: req.params.key.toUpperCase() });
    if (!configuration) {
      return fail(res, { statusCode: 404, message: "Configuración no encontrada." });
    }
    return success(res, { data: configuration });
  } catch (err) {
    return next(err);
  }
}

export async function updateConfiguration(req, res, next) {
  try {
    const key = req.params.key.toUpperCase();
    const { value } = req.body;

    const configuration = await Configuration.findOne({ key });
    if (!configuration) {
      return fail(res, { statusCode: 404, message: "Configuración no encontrada." });
    }

    if (configuration.type === "number" && Number.isNaN(Number(value))) {
      return fail(res, { statusCode: 400, message: "El valor debe ser numérico para esta configuración." });
    }

    configuration.value = String(value);
    await configuration.save();

    return success(res, { message: "Configuración actualizada correctamente.", data: configuration });
  } catch (err) {
    return next(err);
  }
}

// Utilidad interna usada por otros módulos (p. ej. Orders) para obtener el ITBIS vigente
export async function getItbisPercentage() {
  const config = await Configuration.findOne({ key: "ITBIS" });
  return config ? Number(config.value) : 0;
}
