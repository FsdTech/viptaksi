import { demoLog } from "./demoLog";
import { assertDemoEnvironment, isDemoDryRun } from "./demoGuard";
import { countDemoRows, resetDemoDataUnlocked } from "./resetDemoData";
import { withDemoCriticalWriteLock } from "./demoWriteLock";

const USERS_MIN = 20;
const DRIVERS_MIN = 10;
const TRIPS_MIN = 50;

export type DemoHealthResult = {
  counts: {
    users: number;
    drivers: number;
    trips: number;
    payments: number;
  };
  insufficient: boolean;
  resetPerformed: boolean;
  /** True when Postgres advisory lock was not acquired (another worker won). */
  skippedLock?: boolean;
};

function isInsufficient(counts: DemoHealthResult["counts"]): boolean {
  return counts.users < USERS_MIN || counts.drivers < DRIVERS_MIN || counts.trips < TRIPS_MIN;
}

/**
 * Read-only snapshot (no reset). Does not require ALLOW_DEMO.
 */
export async function checkDemoHealth(): Promise<DemoHealthResult> {
  demoLog("HEALTH", "Checking data...");
  const counts = await countDemoRows();
  const insufficient = isInsufficient(counts);
  return { counts, insufficient, resetPerformed: false };
}

/**
 * Asserts demo env, serializes with mutex + advisory lock, then repairs if counts are low.
 * If another process holds the advisory lock, exits safely without throwing.
 */
export async function ensureDemoReady(): Promise<DemoHealthResult> {
  assertDemoEnvironment();

  const outcome = await withDemoCriticalWriteLock(async (): Promise<DemoHealthResult> => {
    demoLog("HEALTH", "Checking data...");
    let counts = await countDemoRows();
    const insufficient = isInsufficient(counts);
    if (!insufficient) {
      return { counts, insufficient: false, resetPerformed: false };
    }

    demoLog("HEALTH", "Data insufficient → fixing");
    await resetDemoDataUnlocked();
    counts = await countDemoRows();
    if (!isDemoDryRun()) {
      demoLog("RESET", "Reset complete");
    }
    return { counts, insufficient: true, resetPerformed: !isDemoDryRun() };
  });

  if (!outcome.locked) {
    const counts = await countDemoRows();
    return {
      counts,
      insufficient: isInsufficient(counts),
      resetPerformed: false,
      skippedLock: true,
    };
  }

  return outcome.value;
}

export type DemoMonitorHandle = { stop: () => void };

/**
 * Runs ensureDemoReady() every 10 minutes. Does not start automatically — caller must invoke.
 */
export function startDemoMonitor(): DemoMonitorHandle {
  const intervalMs = 10 * 60 * 1000;
  const id = setInterval(() => {
    void ensureDemoReady().catch((err) => {
      demoLog("HEALTH", `Monitor error: ${err instanceof Error ? err.message : String(err)}`);
    });
  }, intervalMs);
  return {
    stop: () => clearInterval(id),
  };
}
