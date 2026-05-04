"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDemoColumns = ensureDemoColumns;
const connection_1 = require("../db/connection");
const DEMO_TABLES = ["users", "drivers", "trips", "payments"];
/**
 * Ensures `is_demo` exists on core tables. Safe to run repeatedly (idempotent).
 */
async function ensureDemoColumns() {
    for (const table of DEMO_TABLES) {
        await (0, connection_1.query)(`
      ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false
    `);
    }
}
