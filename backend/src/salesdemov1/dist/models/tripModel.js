"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDemoTrip = insertDemoTrip;
const connection_1 = require("../db/connection");
async function insertDemoTrip(client, params) {
    const sql = `
    INSERT INTO trips (
      driver_id, rider_id, vehicle_type_id, status,
      start_lat, start_lng, end_lat, end_lng,
      estimated_distance_km, estimated_duration_min, actual_duration_min,
      price, created_at, completed_at, is_demo
    )
    VALUES (
      $1, $2, $3, $4::trip_status,
      $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true
    )
    RETURNING id
  `;
    const values = [
        params.driverId,
        params.riderId,
        params.vehicleTypeId,
        params.status,
        params.startLat,
        params.startLng,
        params.endLat,
        params.endLng,
        params.distanceKm,
        params.durationMin,
        params.actualDurationMin,
        params.price,
        params.createdAt,
        params.completedAt,
    ];
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const { rows } = (await runner(sql, values));
    return { id: rows[0].id };
}
