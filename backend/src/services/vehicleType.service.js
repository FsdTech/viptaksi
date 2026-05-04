const vehicleTypeModel = require("../models/vehicleType.model");
const { AppError } = require("../utils/AppError");

function mapRow(r) {
  return {
    id: r.id,
    name: r.name,
    baseFare: Number(r.base_fare),
    perKmRate: Number(r.per_km_rate),
    perMinRate: Number(r.per_min_rate),
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function listAllTypes() {
  const rows = await vehicleTypeModel.listAll();
  return rows.map(mapRow);
}

async function updateTypes(updates) {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new AppError(400, "Body must be a non-empty array of updates");
  }
  const results = [];
  for (const u of updates) {
    if (!u || !u.id) throw new AppError(400, "Each update requires id");
    const row = await vehicleTypeModel.updateFields(u.id, {
      name: u.name,
      base_fare: u.base_fare,
      per_km_rate: u.per_km_rate,
      per_min_rate: u.per_min_rate,
      is_active: u.is_active,
    });
    if (!row) throw new AppError(404, `Vehicle type not found: ${u.id}`);
    results.push(mapRow(row));
  }
  return results;
}

module.exports = { listAllTypes, updateTypes, mapRow };
