import type pg from "pg";
import { query } from "../db/connection";

export type TripStatusDb =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export async function insertDemoTrip(
  client: pg.PoolClient | null,
  params: {
    driverId: string | null;
    riderId: string;
    vehicleTypeId: string;
    status: TripStatusDb;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    distanceKm: string;
    durationMin: string;
    actualDurationMin: string | null;
    price: number;
    createdAt: Date;
    completedAt: Date | null;
  }
): Promise<{ id: string }> {
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
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const { rows } = (await runner(sql, values)) as { rows: { id: string }[] };
  return { id: rows[0]!.id };
}
