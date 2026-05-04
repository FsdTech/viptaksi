import type pg from "pg";
import { query, withTransaction } from "../db/connection";
import { assertDemoEnvironment, isDemoDryRun } from "./demoGuard";
import { demoLog } from "./demoLog";
import { withDemoCriticalWriteLock } from "./demoWriteLock";
import { ensureDemoColumns } from "./schemaGuard";
import { runSeed } from "../seed/seed";

/**
 * Deletes and reseeds demo rows only. Caller must hold demo write lock (see resetDemoData).
 * Never truncates; only DELETE WHERE is_demo = true.
 */
export async function resetDemoDataUnlocked(): Promise<void> {
  if (isDemoDryRun()) {
    demoLog(
      "RESET",
      "Dry run: would DELETE payments/trips/drivers/users WHERE is_demo=true, then reseed"
    );
    return;
  }

  await ensureDemoColumns();

  await withTransaction(async (client: pg.PoolClient) => {
    const exec = (sql: string) => client.query(sql);

    await exec(`DELETE FROM payments WHERE is_demo = true`);
    await exec(`DELETE FROM trips WHERE is_demo = true`);
    await exec(`DELETE FROM drivers WHERE is_demo = true`);
    await exec(`DELETE FROM users WHERE is_demo = true`);
  });

  await runSeed();
}

/**
 * Deletes ONLY rows flagged with is_demo = true (never truncates).
 * Order respects FKs: payments → trips → drivers → users.
 * Uses in-process mutex + Postgres advisory lock.
 */
export async function resetDemoData(): Promise<void> {
  assertDemoEnvironment();
  const outcome = await withDemoCriticalWriteLock(async () => {
    await resetDemoDataUnlocked();
  });
  if (!outcome.locked) {
    throw new Error("[DEMO][LOCK] Demo reset skipped: another process holds the advisory lock");
  }
}

/** Dry count for logging (optional). */
export async function countDemoRows(): Promise<{
  users: number;
  drivers: number;
  trips: number;
  payments: number;
}> {
  await ensureDemoColumns();
  const u = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true`
  );
  const d = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true`
  );
  const t = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM trips WHERE is_demo = true`
  );
  const p = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM payments WHERE is_demo = true`
  );
  return {
    users: Number(u.rows[0]?.c ?? 0),
    drivers: Number(d.rows[0]?.c ?? 0),
    trips: Number(t.rows[0]?.c ?? 0),
    payments: Number(p.rows[0]?.c ?? 0),
  };
}
