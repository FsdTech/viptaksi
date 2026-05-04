import type { DemoHealthResult } from "./demoHealth";
import { ensureDemoReady } from "./demoHealth";
import { demoLog } from "./demoLog";

const INIT_TIMEOUT_MS = 5000;

let demoEntryInitialized = false;
let lastResult: DemoHealthResult | undefined;
let inflight: Promise<DemoHealthResult | undefined> | null = null;

function raceEnsureDemoReady(): Promise<DemoHealthResult | "timeout"> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve("timeout");
    }, INIT_TIMEOUT_MS);

    ensureDemoReady()
      .then((v) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Runs {@link ensureDemoReady} once per process (first access only). Later calls return
 * immediately without re-running health checks. Uses a 5s ceiling: on slow init, logs a
 * warning and unblocks; the in-flight {@link ensureDemoReady} is not cancelled and may
 * still complete afterward.
 */
export async function ensureDemoOnFirstAccess(): Promise<DemoHealthResult | undefined> {
  if (demoEntryInitialized) {
    return lastResult;
  }

  if (!inflight) {
    inflight = (async (): Promise<DemoHealthResult | undefined> => {
      try {
        demoLog("ENTRY", "Initializing demo...");
        const outcome = await raceEnsureDemoReady();

        if (outcome === "timeout") {
          demoLog(
            "ENTRY",
            `ensureDemoReady exceeded ${INIT_TIMEOUT_MS}ms — continuing without blocking`
          );
          lastResult = undefined;
        } else {
          lastResult = outcome;
          demoLog("ENTRY", "Demo ready");
        }

        demoEntryInitialized = true;
        return lastResult;
      } finally {
        inflight = null;
      }
    })();
  }

  return inflight;
}
