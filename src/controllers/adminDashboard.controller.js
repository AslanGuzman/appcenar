import { success } from "../utils/apiResponse.js";
import { getDashboardMetrics } from "../services/dashboard.service.js";

export async function getDashboard(req, res, next) {
  try {
    return success(res, { data: await getDashboardMetrics() });
  } catch (err) {
    return next(err);
  }
}
