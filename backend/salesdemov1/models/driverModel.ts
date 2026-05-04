import type pg from "pg";
import { query } from "../db/connection";
import { DemoSafetyError } from "../utils/demoSafety";

export async function insertDemoDriver(
  client: pg.PoolClient | null,
  params: {
    userId: string;
    vehicleTypeId: string;
    isOnline: boolean;
    lat: number;
    lng: number;
    rating: string;
  }
): Promise<{ id: string }> {
  const sql = `
    INSERT INTO drivers (
      user_id, vehicle_type_id, is_online, lat, lng, rating, is_demo
    )
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id
  `;
  const values = [
    params.userId,
    params.vehicleTypeId,
    params.isOnline,
    params.lat,
    params.lng,
    params.rating,
  ];
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const { rows } = (await runner(sql, values)) as { rows: { id: string }[] };
  return { id: rows[0]!.id };
}

/**
 * Deletes demo drivers by id. Refuses if the delete would remove every demo driver.
 */
export async function deleteDemoDriversByIds(
  client: pg.PoolClient | null,
  ids: string[]
): Promise<number> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return 0;
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const totalR = (await runner(`SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true`)) as {
    rows: { c: string }[];
  };
  const totalDemo = Number(totalR.rows[0]?.c ?? 0);
  const hitR = (await runner(
    `SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true AND id = ANY($1::uuid[])`,
    [unique]
  )) as { rows: { c: string }[] };
  const wouldDelete = Number(hitR.rows[0]?.c ?? 0);
  if (totalDemo > 0 && wouldDelete >= totalDemo) {
    throw new DemoSafetyError(
      "Demo protection: cannot delete all demo drivers. Leave at least one demo driver, or use the isolated demo reset pipeline."
    );
  }
  const del = await runner(`DELETE FROM drivers WHERE is_demo = true AND id = ANY($1::uuid[])`, [
    unique,
  ]);
  return del.rowCount ?? 0;
}
