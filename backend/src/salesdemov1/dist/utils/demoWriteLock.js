"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withDemoCriticalWriteLock = withDemoCriticalWriteLock;
const connection_1 = require("../db/connection");
const demoLog_1 = require("./demoLog");
const mutex_1 = require("./mutex");
const ADVISORY_LOCK_KEY = 987654321;
/**
 * Serialize demo writes in-process and across processes (Postgres advisory lock).
 */
async function withDemoCriticalWriteLock(fn) {
    await mutex_1.demoMutex.acquire();
    try {
        const row = await (0, connection_1.query)(`SELECT pg_try_advisory_lock($1::bigint) AS ok`, [ADVISORY_LOCK_KEY]);
        const ok = row.rows[0]?.ok === true;
        if (!ok) {
            (0, demoLog_1.demoLog)("LOCK", "Another process is running");
            return { locked: false, reason: "advisory-busy" };
        }
        try {
            const value = await fn();
            return { locked: true, value };
        }
        finally {
            await (0, connection_1.query)(`SELECT pg_advisory_unlock($1::bigint)`, [ADVISORY_LOCK_KEY]);
        }
    }
    finally {
        mutex_1.demoMutex.release();
    }
}
