const { query } = require("../config/database");

async function createTrip({
  riderId,
  vehicleTypeId,
  startLat,
  startLng,
  endLat,
  endLng,
  estimatedDistanceKm,
  estimatedDurationMin,
  price,
}) {
  const { rows } = await query(
    `INSERT INTO trips (
       rider_id, vehicle_type_id, status,
       start_lat, start_lng, end_lat, end_lng,
       estimated_distance_km, estimated_duration_min, price
     ) VALUES (
       $1, $2, 'pending'::trip_status,
       $3, $4, $5, $6,
       $7, $8, $9
     )
     RETURNING *`,
    [
      riderId,
      vehicleTypeId,
      startLat,
      startLng,
      endLat,
      endLng,
      estimatedDistanceKm,
      estimatedDurationMin,
      price,
    ]
  );
  return rows[0];
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM trips WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function assignDriverAndStatus(tripId, driverId, status) {
  const { rows } = await query(
    `UPDATE trips SET driver_id = $2, status = $3::trip_status, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [tripId, driverId, status]
  );
  return rows[0] || null;
}

async function completeTrip(tripId, { actualDurationMin, price, endLat, endLng }) {
  const { rows } = await query(
    `UPDATE trips SET
       status = 'completed'::trip_status,
       actual_duration_min = COALESCE($2, actual_duration_min),
       price = COALESCE($3, price),
       end_lat = COALESCE($4, end_lat),
       end_lng = COALESCE($5, end_lng),
       completed_at = NOW(),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [tripId, actualDurationMin, price, endLat, endLng]
  );
  return rows[0] || null;
}

async function listAllForAdmin() {
  const { rows } = await query(`
    SELECT
      t.*,
      ru.name AS rider_name,
      ru.email AS rider_email,
      du.name AS driver_name,
      du.email AS driver_email,
      vt.name AS vehicle_type_name
    FROM trips t
    JOIN users ru ON ru.id = t.rider_id
    LEFT JOIN drivers d ON d.id = t.driver_id
    LEFT JOIN users du ON du.id = d.user_id
    JOIN vehicle_types vt ON vt.id = t.vehicle_type_id
    ORDER BY t.created_at DESC
    LIMIT 500
  `);
  return rows;
}

async function cancelByRider(tripId, riderId) {
  const { rows } = await query(
    `UPDATE trips SET status = 'cancelled'::trip_status, updated_at = NOW()
     WHERE id = $1 AND rider_id = $2 AND status = 'pending'::trip_status
     RETURNING *`,
    [tripId, riderId]
  );
  return rows[0] || null;
}

async function startByDriver(tripId, driverId) {
  const { rows } = await query(
    `UPDATE trips SET status = 'in_progress'::trip_status, updated_at = NOW()
     WHERE id = $1 AND driver_id = $2 AND status = 'accepted'::trip_status
     RETURNING *`,
    [tripId, driverId]
  );
  return rows[0] || null;
}

async function listPendingByVehicleType(vehicleTypeId, limit = 50) {
  const { rows } = await query(
    `SELECT * FROM trips
     WHERE vehicle_type_id = $1 AND status = 'pending'::trip_status
     ORDER BY created_at ASC
     LIMIT $2`,
    [vehicleTypeId, limit]
  );
  return rows;
}

async function listRecentForRider(riderId, limit = 30) {
  const { rows } = await query(
    `SELECT * FROM trips WHERE rider_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [riderId, limit]
  );
  return rows;
}

async function listRecentForDriver(driverId, limit = 30) {
  const { rows } = await query(
    `SELECT * FROM trips WHERE driver_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [driverId, limit]
  );
  return rows;
}

module.exports = {
  createTrip,
  findById,
  assignDriverAndStatus,
  completeTrip,
  listAllForAdmin,
  cancelByRider,
  startByDriver,
  listPendingByVehicleType,
  listRecentForRider,
  listRecentForDriver,
};
