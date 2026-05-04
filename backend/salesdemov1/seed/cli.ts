import { closePool } from "../db/connection";
import { assertDemoEnvironment } from "../utils/demoGuard";
import { demoLog } from "../utils/demoLog";
import { loadSalesDemoEnv } from "../utils/loadEnv";
import { withDemoCriticalWriteLock } from "../utils/demoWriteLock";
import { runSeed } from "./seed";

const RIDERS = 50;
const DRIVERS = 20;
const TRIPS = 120;
const PAYMENTS = 40;

async function main() {
  loadSalesDemoEnv();
  assertDemoEnvironment();
  const outcome = await withDemoCriticalWriteLock(async () => {
    await runSeed();
  });
  if (!outcome.locked) {
    demoLog("LOCK", "Another process is running — seed skipped");
    await closePool();
    process.exit(0);
  }
  console.log("[salesdemov1] Seed complete:", { riders: RIDERS, drivers: DRIVERS, trips: TRIPS, payments: PAYMENTS });
  await closePool();
}

void main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => {});
  process.exit(1);
});
