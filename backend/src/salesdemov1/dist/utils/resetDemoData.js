"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDemoDataUnlocked = resetDemoDataUnlocked;
exports.resetDemoData = resetDemoData;
exports.countDemoRows = countDemoRows;
const connection_1 = require("../db/connection");
const demoGuard_1 = require("./demoGuard");
const demoLog_1 = require("./demoLog");
const demoWriteLock_1 = require("./demoWriteLock");
const schemaGuard_1 = require("./schemaGuard");
const seed_1 = require("../seed/seed");
/**
 * Deletes and reseeds demo rows only. Caller must hold demo write lock (see resetDemoData).
 * Never truncates; only DELETE WHERE is_demo = true.
 */
async function resetDemoDataUnlocked() {
    if ((0, demoGuard_1.isDemoDryRun)()) {
        (0, demoLog_1.demoLog)("RESET", "Dry run: would DELETE payments/trips/drivers/users WHERE is_demo=true, then reseed");
        return;
    }
    await (0, schemaGuard_1.ensureDemoColumns)();
    await (0, connection_1.withTransaction)(async (client) => {
        const exec = (sql) => client.query(sql);
        await exec(`DELETE FROM payments WHERE is_demo = true`);
        await exec(`DELETE FROM trips WHERE is_demo = true`);
        await exec(`DELETE FROM drivers WHERE is_demo = true`);
        await exec(`DELETE FROM users WHERE is_demo = true`);
    });
    await (0, seed_1.runSeed)();
}
/**
 * Deletes ONLY rows flagged with is_demo = true (never truncates).
 * Order respects FKs: payments → trips → drivers → users.
 * Uses in-process mutex + Postgres advisory lock.
 */
async function resetDemoData() {
    (0, demoGuard_1.assertDemoEnvironment)();
    const outcome = await (0, demoWriteLock_1.withDemoCriticalWriteLock)(async () => {
        await resetDemoDataUnlocked();
    });
    if (!outcome.locked) {
        throw new Error("[DEMO][LOCK] Demo reset skipped: another process holds the advisory lock");
    }
}
/** Dry count for logging (optional). */
async function countDemoRows() {
    await (0, schemaGuard_1.ensureDemoColumns)();
    const u = await (0, connection_1.query)(`SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true`);
    const d = await (0, connection_1.query)(`SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true`);
    const t = await (0, connection_1.query)(`SELECT COUNT(*)::text AS c FROM trips WHERE is_demo = true`);
    const p = await (0, connection_1.query)(`SELECT COUNT(*)::text AS c FROM payments WHERE is_demo = true`);
    return {
        users: Number(u.rows[0]?.c ?? 0),
        drivers: Number(d.rows[0]?.c ?? 0),
        trips: Number(t.rows[0]?.c ?? 0),
        payments: Number(p.rows[0]?.c ?? 0),
    };
}
