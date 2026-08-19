import { success } from "../utils/apiResponse.js";
import {
  listConfigurations,
  getConfigurationByKey as findConfigurationByKey,
  updateConfiguration as saveConfiguration,
} from "../services/configuration.service.js";

export async function getConfigurations(req, res, next) {
  try {
    return success(res, { data: await listConfigurations() });
  } catch (err) {
    return next(err);
  }
}

export async function getConfigurationByKey(req, res, next) {
  try {
    return success(res, { data: await findConfigurationByKey(req.params.key) });
  } catch (err) {
    return next(err);
  }
}

export async function updateConfiguration(req, res, next) {
  try {
    const configuration = await saveConfiguration(req.params.key, req.body.value);

    return success(res, { message: "Configuración actualizada correctamente.", data: configuration });
  } catch (err) {
    return next(err);
  }
}
