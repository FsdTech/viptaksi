const { calculateTripPrice } = require("../utils/pricing.util");
const { haversineKm } = require("../utils/distance.util");
const vehicleTypeModel = require("../models/vehicleType.model");
const { AppError } = require("../utils/AppError");

async function quoteTrip({ vehicleTypeId, startLat, startLng, endLat, endLng, durationMin }) {
  const vt = await vehicleTypeModel.findById(vehicleTypeId);
  if (!vt || !vt.is_active) {
    throw new AppError(400, "Invalid or inactive vehicle type");
  }
  const distanceKm = haversineKm(startLat, startLng, endLat, endLng);
  let shortDistanceMinFare;
  try {
    const { pool } = require("../db");
    const s = await pool.query(
      "SELECT short_distance_min_fare FROM settings ORDER BY id ASC LIMIT 1"
    );
    shortDistanceMinFare = Number(s.rows[0]?.short_distance_min_fare);
  } catch (_err) {
    shortDistanceMinFare = undefined;
  }
  const price = calculateTripPrice({
    baseFare: vt.base_fare,
    perKmRate: vt.per_km_rate,
    perMinRate: vt.per_min_rate,
    distanceKm,
    durationMin,
    shortDistanceMinFare,
  });
  return {
    vehicleType: vt,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    durationMin: Number(durationMin),
    price,
  };
}

module.exports = { quoteTrip };
