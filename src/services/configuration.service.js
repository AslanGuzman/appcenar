import { Configuration } from "../models/Configuration.js";
import { AppError } from "../utils/appError.js";

export const ITBIS_KEY = "ITBIS";

export async function listConfigurations() {
  return Configuration.find().sort({ key: 1 });
}

export async function getConfigurationByKey(key) {
  const configuration = await Configuration.findOne({ key: key.toUpperCase() });

  if (!configuration) {
    throw new AppError("Configuración no encontrada.", 404);
  }

  return configuration;
}

export async function updateConfiguration(key, value) {
  const configuration = await getConfigurationByKey(key);

  if (configuration.type === "number" && Number.isNaN(Number(value))) {
    throw new AppError("El valor debe ser numérico para esta configuración.", 400);
  }

  configuration.value = String(value);
  await configuration.save();

  return configuration;
}

export async function getItbisPercentage() {
  const configuration = await Configuration.findOne({ key: ITBIS_KEY });
  return configuration ? Number(configuration.value) : 0;
}

export function calculateOrderTotals(items, itbisPercentage) {
  const subtotal = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const itbisAmount = Number(((subtotal * itbisPercentage) / 100).toFixed(2));
  const total = Number((subtotal + itbisAmount).toFixed(2));

  return { subtotal, itbisPercentage, itbisAmount, total };
}
