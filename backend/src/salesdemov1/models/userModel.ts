import type pg from "pg";
import { query } from "../db/connection";
import { DemoSafetyError } from "../utils/demoSafety";

export async function insertDemoUser(
  client: pg.PoolClient | null,
  params: {
    name: string;
    email: string;
    phone: string | null;
    passwordHash: string;
    role: "rider" | "driver";
  }
): Promise<{ id: string }> {
  const sql = `
    INSERT INTO users (name, email, phone, password_hash, role, is_demo)
    VALUES ($1, $2, $3, $4, $5::user_role, true)
    RETURNING id
  `;
  const values = [params.name, params.email, params.phone, params.passwordHash, params.role];
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const { rows } = (await runner(sql, values)) as { rows: { id: string }[] };
  return { id: rows[0]!.id };
}

/**
 * Deletes demo users by id. Refuses if the delete would remove every demo user (sales safety).
 */
export async function deleteDemoUsersByIds(
  client: pg.PoolClient | null,
  ids: string[]
): Promise<number> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return 0;
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const totalR = (await runner(`SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true`)) as {
    rows: { c: string }[];
  };
  const totalDemo = Number(totalR.rows[0]?.c ?? 0);
  const hitR = (await runner(
    `SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true AND id = ANY($1::uuid[])`,
    [unique]
  )) as { rows: { c: string }[] };
  const wouldDelete = Number(hitR.rows[0]?.c ?? 0);
  if (totalDemo > 0 && wouldDelete >= totalDemo) {
    throw new DemoSafetyError(
      "Demo protection: cannot delete all demo users. Leave at least one demo user, or use the isolated demo reset pipeline."
    );
  }
  const del = await runner(`DELETE FROM users WHERE is_demo = true AND id = ANY($1::uuid[])`, [
    unique,
  ]);
  return del.rowCount ?? 0;
}
