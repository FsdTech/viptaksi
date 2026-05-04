"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSalesDemoEnv = loadSalesDemoEnv;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
/**
 * Loads env without modifying the main app: tries salesdemov1/.env, repo .env, backend/.env.
 */
function loadSalesDemoEnv() {
    const here = path_1.default.resolve(__dirname, "..");
    const repoRoot = path_1.default.resolve(here, "..");
    const candidates = [
        path_1.default.join(here, ".env"),
        path_1.default.join(repoRoot, ".env"),
        path_1.default.join(repoRoot, "backend", ".env"),
    ];
    for (const p of candidates) {
        if (fs_1.default.existsSync(p)) {
            dotenv_1.default.config({ path: p, override: false });
        }
    }
}
