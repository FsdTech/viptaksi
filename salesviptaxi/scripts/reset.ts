import { closePool } from "../db/connection";
import { loadSalesDemoEnv } from "../utils/loadEnv";
import { resetDemoData } from "../utils/resetDemoData";

async function main() {
  loadSalesDemoEnv();
  await resetDemoData();
  console.log("[salesdemov1] Reset + reseed complete.");
  await closePool();
}

void main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => {});
  process.exit(1);
});
