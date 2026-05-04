"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDemoHealth = checkDemoHealth;
exports.ensureDemoReady = ensureDemoReady;
exports.startDemoMonitor = startDemoMonitor;
const demoLog_1 = require("./demoLog");
const demoGuard_1 = require("./demoGuard");
const resetDemoData_1 = require("./resetDemoData");
const demoWriteLock_1 = require("./demoWriteLock");
const USERS_MIN = 20;
const DRIVERS_MIN = 10;
const TRIPS_MIN = 50;
function isInsufficient(counts) {
    return counts.users < USERS_MIN || counts.drivers < DRIVERS_MIN || counts.trips < TRIPS_MIN;
}
/**
 * Read-only snapshot (no reset). Does not require ALLOW_DEMO.
 */
async function checkDemoHealth() {
    (0, demoLog_1.demoLog)("HEALTH", "Checking data...");
    const counts = await (0, resetDemoData_1.countDemoRows)();
    const insufficient = isInsufficient(counts);
    return { counts, insufficient, resetPerformed: false };
}
/**
 * Asserts demo env, serializes with mutex + advisory lock, then repairs if counts are low.
 * If another process holds the advisory lock, exits safely without throwing.
 */
async function ensureDemoReady() {
    (0, demoGuard_1.assertDemoEnvironment)();
    const outcome = await (0, demoWriteLock_1.withDemoCriticalWriteLock)(async () => {
        (0, demoLog_1.demoLog)("HEALTH", "Checking data...");
        let counts = await (0, resetDemoData_1.countDemoRows)();
        const insufficient = isInsufficient(counts);
        if (!insufficient) {
            return { counts, insufficient: false, resetPerformed: false };
        }
        (0, demoLog_1.demoLog)("HEALTH", "Data insufficient → fixing");
        await (0, resetDemoData_1.resetDemoDataUnlocked)();
        counts = await (0, resetDemoData_1.countDemoRows)();
        if (!(0, demoGuard_1.isDemoDryRun)()) {
            (0, demoLog_1.demoLog)("RESET", "Reset complete");
        }
        return { counts, insufficient: true, resetPerformed: !(0, demoGuard_1.isDemoDryRun)() };
    });
    if (!outcome.locked) {
        const counts = await (0, resetDemoData_1.countDemoRows)();
        return {
            counts,
            insufficient: isInsufficient(counts),
            resetPerformed: false,
            skippedLock: true,
        };
    }
    return outcome.value;
}
/**
 * Runs ensureDemoReady() every 10 minutes. Does not start automatically — caller must invoke.
 */
function startDemoMonitor() {
    const intervalMs = 10 * 60 * 1000;
    const id = setInterval(() => {
        void ensureDemoReady().catch((err) => {
            (0, demoLog_1.demoLog)("HEALTH", `Monitor error: ${err instanceof Error ? err.message : String(err)}`);
        });
    }, intervalMs);
    return {
        stop: () => clearInterval(id),
    };
}
