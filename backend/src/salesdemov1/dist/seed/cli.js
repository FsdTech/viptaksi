"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
const demoGuard_1 = require("../utils/demoGuard");
const demoLog_1 = require("../utils/demoLog");
const loadEnv_1 = require("../utils/loadEnv");
const demoWriteLock_1 = require("../utils/demoWriteLock");
const seed_1 = require("./seed");
const RIDERS = 50;
const DRIVERS = 20;
const TRIPS = 120;
const PAYMENTS = 40;
async function main() {
    (0, loadEnv_1.loadSalesDemoEnv)();
    (0, demoGuard_1.assertDemoEnvironment)();
    const outcome = await (0, demoWriteLock_1.withDemoCriticalWriteLock)(async () => {
        await (0, seed_1.runSeed)();
    });
    if (!outcome.locked) {
        (0, demoLog_1.demoLog)("LOCK", "Another process is running — seed skipped");
        await (0, connection_1.closePool)();
        process.exit(0);
    }
    console.log("[salesdemov1] Seed complete:", { riders: RIDERS, drivers: DRIVERS, trips: TRIPS, payments: PAYMENTS });
    await (0, connection_1.closePool)();
}
void main().catch(async (err) => {
    console.error(err);
    await (0, connection_1.closePool)().catch(() => { });
    process.exit(1);
});
