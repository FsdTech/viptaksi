"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("../db/connection");
const loadEnv_1 = require("../utils/loadEnv");
const resetDemoData_1 = require("../utils/resetDemoData");
async function main() {
    (0, loadEnv_1.loadSalesDemoEnv)();
    await (0, resetDemoData_1.resetDemoData)();
    console.log("[salesdemov1] Reset + reseed complete.");
    await (0, connection_1.closePool)();
}
void main().catch(async (err) => {
    console.error(err);
    await (0, connection_1.closePool)().catch(() => { });
    process.exit(1);
});
