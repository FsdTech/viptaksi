import { query } from "../db/connection";

const DEMO_TABLES = ["users", "drivers", "trips", "payments"] as const;

/**
 * Ensures `is_demo` exists on core tables. Safe to run repeatedly (idempotent).
 */
export async function ensureDemoColumns(): Promise<void> {
  for (const table of DEMO_TABLES) {
    await query(`
      ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false
    `);
  }
}
