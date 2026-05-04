import fs from "fs";
import path from "path";
import dotenv from "dotenv";

/**
 * Loads env without modifying the main app: tries salesdemov1/.env, repo .env, backend/.env.
 */
export function loadSalesDemoEnv(): void {
  const here = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(here, "..");

  const candidates = [
    path.join(here, ".env"),
    path.join(repoRoot, ".env"),
    path.join(repoRoot, "backend", ".env"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p, override: false });
    }
  }
}
