/**
 * Gate for any demo seed/reset. Set ALLOW_DEMO=true only on demo/staging hosts.
 * DATABASE_URL must contain "demo" or "staging" (case-insensitive), unless DEMO_RELAX_DB_URL=true.
 */
export function assertDemoEnvironment(): void {
  if (process.env.ALLOW_DEMO !== "true") {
    throw new Error("[DEMO] Unsafe environment detected");
  }

  const relax = process.env.DEMO_RELAX_DB_URL === "true";
  if (relax) return;

  const url = (process.env.DATABASE_URL ?? "").toLowerCase();
  if (!url.includes("demo") && !url.includes("staging")) {
    throw new Error("[DEMO] Unsafe environment detected");
  }
}

export function isDemoDryRun(): boolean {
  return process.env.DEMO_DRY_RUN === "true";
}
