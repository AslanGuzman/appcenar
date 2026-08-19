const FLASH_KEY = "formData";
const OMITTED_FIELDS = ["password", "confirmPassword"];

export function flashFormData(req, data = req.body) {
  const clean = Object.fromEntries(
    Object.entries(data || {}).filter(([key]) => !OMITTED_FIELDS.includes(key))
  );

  req.flash(FLASH_KEY, JSON.stringify(clean));
}

export function popFormData(req) {
  const [raw] = req.flash(FLASH_KEY);

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
