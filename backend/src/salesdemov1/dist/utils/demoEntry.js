"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDemoOnFirstAccess = ensureDemoOnFirstAccess;
const demoHealth_1 = require("./demoHealth");
const demoLog_1 = require("./demoLog");
const INIT_TIMEOUT_MS = 5000;
let demoEntryInitialized = false;
let lastResult;
let inflight = null;
function raceEnsureDemoReady() {
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled)
                return;
            settled = true;
            resolve("timeout");
        }, INIT_TIMEOUT_MS);
        (0, demoHealth_1.ensureDemoReady)()
            .then((v) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve(v);
        })
            .catch((err) => {
            if (settled)
                return;
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
async function ensureDemoOnFirstAccess() {
    if (demoEntryInitialized) {
        return lastResult;
    }
    if (!inflight) {
        inflight = (async () => {
            try {
                (0, demoLog_1.demoLog)("ENTRY", "Initializing demo...");
                const outcome = await raceEnsureDemoReady();
                if (outcome === "timeout") {
                    (0, demoLog_1.demoLog)("ENTRY", `ensureDemoReady exceeded ${INIT_TIMEOUT_MS}ms — continuing without blocking`);
                    lastResult = undefined;
                }
                else {
                    lastResult = outcome;
                    (0, demoLog_1.demoLog)("ENTRY", "Demo ready");
                }
                demoEntryInitialized = true;
                return lastResult;
            }
            finally {
                inflight = null;
            }
        })();
    }
    return inflight;
}
