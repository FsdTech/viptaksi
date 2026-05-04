import { query } from "../db/connection";
import { demoLog } from "./demoLog";
import { demoMutex } from "./mutex";

const ADVISORY_LOCK_KEY = 987654321;

export type DemoWriteLockResult<T> =
  | { locked: true; value: T }
  | { locked: false; reason: "advisory-busy" };

/**
 * Serialize demo writes in-process and across processes (Postgres advisory lock).
 */
export async function withDemoCriticalWriteLock<T>(fn: () => Promise<T>): Promise<DemoWriteLockResult<T>> {
  await demoMutex.acquire();
  try {
    const row = await query<{ ok: boolean }>(
      `SELECT pg_try_advisory_lock($1::bigint) AS ok`,
      [ADVISORY_LOCK_KEY]
    );
    const ok = row.rows[0]?.ok === true;
    if (!ok) {
      demoLog("LOCK", "Another process is running");
      return { locked: false, reason: "advisory-busy" };
    }
    try {
      const value = await fn();
      return { locked: true, value };
    } finally {
      await query(`SELECT pg_advisory_unlock($1::bigint)`, [ADVISORY_LOCK_KEY]);
    }
  } finally {
    demoMutex.release();
  }
}
