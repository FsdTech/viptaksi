"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.withTransaction = withTransaction;
exports.closePool = closePool;
const pg_1 = __importDefault(require("pg"));
let pool = null;
function getPool() {
    if (!pool) {
        const url = process.env.DATABASE_URL?.trim();
        if (!url) {
            throw new Error("DATABASE_URL is required (set in env or salesdemov1/.env)");
        }
        pool = new pg_1.default.Pool({
            connectionString: url,
            max: 10,
            idleTimeoutMillis: 30000,
        });
        pool.on("error", (err) => {
            console.error("[salesdemov1] PG pool error", err);
        });
    }
    return pool;
}
async function query(text, params) {
    return getPool().query(text, params);
}
async function withTransaction(fn) {
    const client = await getPool().connect();
    try {
        await client.query("BEGIN");
        const out = await fn(client);
        await client.query("COMMIT");
        return out;
    }
    catch (e) {
        await client.query("ROLLBACK");
        throw e;
    }
    finally {
        client.release();
    }
}
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
