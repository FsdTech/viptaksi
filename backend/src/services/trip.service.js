const tripModel = require("../models/trip.model");
const driverModel = require("../models/driver.model");
const vehicleTypeModel = require("../models/vehicleType.model");
const { quoteTrip } = require("./pricing.service");
const { calculateTripPrice } = require("../utils/pricing.util");
const { haversineKm } = require("../utils/distance.util");
const { AppError } = require("../utils/AppError");
const { emitToRoom } = require("../sockets/realtime.registry");

function broadcastTripToParties(trip) {
  if (!trip) return;
  const payload = { trip };
  emitToRoom(`vt:${trip.vehicle_type_id}`, "trip:updated", payload);
  emitToRoom(`rider:${trip.rider_id}`, "trip:updated", payload);
  if (trip.driver_id) {
    emitToRoom(`driver:${trip.driver_id}`, "trip:updated", payload);
  }
}

async function createTripForRider(userId, body) {
  const {
    vehicle_type_id: vehicleTypeId,
    start_lat: startLat,
    start_lng: startLng,
    end_lat: endLat,
    end_lng: endLng,
    estimated_duration_min: estimatedDurationMin,
  } = body;

  const q = await quoteTrip({
    vehicleTypeId,
    startLat,
    startLng,
    endLat,
    endLng,
    durationMin: estimatedDurationMin,
  });

  const trip = await tripModel.createTrip({
    riderId: userId,
    vehicleTypeId,
    startLat,
    startLng,
    endLat,
    endLng,
    estimatedDistanceKm: q.distanceKm,
    estimatedDurationMin: estimatedDurationMin,
    price: q.price,
  });

  broadcastTripToParties(trip);

  return { trip, quote: q };
}

async function acceptTrip(driverUserId, tripId) {
  const driver = await driverModel.findByUserId(driverUserId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  if (!driver.is_online) throw new AppError(409, "Driver must be online to accept trips");

  const trip = await tripModel.findById(tripId);
  if (!trip) throw new AppError(404, "Trip not found");
  if (trip.status !== "pending") {
    throw new AppError(409, "Trip is not available for acceptance");
  }

  if (String(trip.vehicle_type_id) !== String(driver.vehicle_type_id)) {
    throw new AppError(409, "Trip vehicle type does not match driver vehicle type");
  }

  const updated = await tripModel.assignDriverAndStatus(trip.id, driver.id, "accepted");
  broadcastTripToParties(updated);
  return updated;
}

async function completeTrip(driverUserId, body) {
  const {
    trip_id: tripId,
    actual_duration_min: actualDurationMin,
    end_lat: endLat,
    end_lng: endLng,
  } = body;

  const driver = await driverModel.findByUserId(driverUserId);
  if (!driver) throw new AppError(404, "Driver profile not found");

  const trip = await tripModel.findById(tripId);
  if (!trip) throw new AppError(404, "Trip not found");
  if (!trip.driver_id || String(trip.driver_id) !== String(driver.id)) {
    throw new AppError(403, "Trip is not assigned to this driver");
  }
  if (trip.status === "completed") {
    throw new AppError(409, "Trip already completed");
  }
  if (trip.status !== "accepted" && trip.status !== "in_progress") {
    throw new AppError(409, "Trip cannot be completed from current status");
  }

  const vt = await vehicleTypeModel.findById(trip.vehicle_type_id);
  if (!vt) throw new AppError(500, "Vehicle type missing for trip");

  const finalEndLat = endLat != null ? endLat : trip.end_lat;
  const finalEndLng = endLng != null ? endLng : trip.end_lng;
  const distanceKm = haversineKm(
    trip.start_lat,
    trip.start_lng,
    finalEndLat,
    finalEndLng
  );
  const duration =
    actualDurationMin != null ? actualDurationMin : trip.estimated_duration_min;

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

  const finalPrice = calculateTripPrice({
    baseFare: vt.base_fare,
    perKmRate: vt.per_km_rate,
    perMinRate: vt.per_min_rate,
    distanceKm,
    durationMin: duration,
    shortDistanceMinFare,
  });

  const updated = await tripModel.completeTrip(trip.id, {
    actualDurationMin: actualDurationMin != null ? actualDurationMin : null,
    price: finalPrice,
    endLat: endLat != null ? endLat : null,
    endLng: endLng != null ? endLng : null,
  });

  broadcastTripToParties(updated);
  return updated;
}

async function cancelTripByRider(riderUserId, tripId) {
  const trip = await tripModel.findById(tripId);
  if (!trip) throw new AppError(404, "Trip not found");
  if (String(trip.rider_id) !== String(riderUserId)) {
    throw new AppError(403, "Not your trip");
  }
  if (trip.status !== "pending") {
    throw new AppError(409, "Only pending trips can be cancelled");
  }
  const updated = await tripModel.cancelByRider(tripId, riderUserId);
  broadcastTripToParties(updated);
  return updated;
}

async function startTripByDriver(driverUserId, tripId) {
  const driver = await driverModel.findByUserId(driverUserId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  const updated = await tripModel.startByDriver(tripId, driver.id);
  if (!updated) {
    throw new AppError(409, "Trip cannot be started (wrong state or not assigned to you)");
  }
  broadcastTripToParties(updated);
  return updated;
}

async function listPendingForDriver(driverUserId) {
  const driver = await driverModel.findByUserId(driverUserId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  if (!driver.is_online) {
    throw new AppError(409, "Go online to see pending trips");
  }
  return tripModel.listPendingByVehicleType(driver.vehicle_type_id);
}

async function listMine(user) {
  if (user.role === "rider") {
    return tripModel.listRecentForRider(user.id);
  }
  if (user.role === "driver") {
    const driver = await driverModel.findByUserId(user.id);
    if (!driver) return [];
    return tripModel.listRecentForDriver(driver.id);
  }
  throw new AppError(403, "Unsupported role");
}

async function listTripsAdmin() {
  return tripModel.listAllForAdmin();
}

module.exports = {
  createTripForRider,
  acceptTrip,
  completeTrip,
  cancelTripByRider,
  startTripByDriver,
  listPendingForDriver,
  listMine,
  listTripsAdmin,
};
