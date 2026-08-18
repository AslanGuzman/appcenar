export function success(res, { statusCode = 200, message = "OK", data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function fail(res, { statusCode = 400, message = "Error", errors = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
