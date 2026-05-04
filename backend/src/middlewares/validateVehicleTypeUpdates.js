const { AppError } = require("../utils/AppError");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateVehicleTypeUpdates(req, res, next) {
  const body = req.body;
  if (!Array.isArray(body) || body.length === 0) {
    return next(new AppError(400, "Body must be a non-empty array of updates"));
  }
  for (let i = 0; i < body.length; i++) {
    const u = body[i];
    if (!u || typeof u !== "object") {
      return next(new AppError(400, `Invalid item at index ${i}`));
    }
    if (!u.id || typeof u.id !== "string" || !UUID_RE.test(u.id)) {
      return next(new AppError(400, `Each item requires a valid UUID id (index ${i})`));
    }
    if (u.name !== undefined && (typeof u.name !== "string" || !u.name.trim())) {
      return next(new AppError(400, `Invalid name at index ${i}`));
    }
    const nums = ["base_fare", "per_km_rate", "per_min_rate"];
    for (const k of nums) {
      if (u[k] === undefined) continue;
      const n = typeof u[k] === "number" ? u[k] : Number(u[k]);
      if (typeof n !== "number" || Number.isNaN(n) || n < 0) {
        return next(new AppError(400, `Invalid ${k} at index ${i}`));
      }
      u[k] = n;
    }
    if (u.is_active !== undefined && typeof u.is_active !== "boolean") {
      return next(new AppError(400, `Invalid is_active at index ${i}`));
    }
  }
  next();
}

module.exports = { validateVehicleTypeUpdates };
