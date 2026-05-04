"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const demoHealth_1 = require("../utils/demoHealth");
const resetDemoData_1 = require("../utils/resetDemoData");
/**
 * Standalone Express router — NOT wired into the main backend.
 * Mount in a small local server, e.g.:
 *   import demo from './salesdemov1/api/demo';
 *   app.use(demo);
 * Then: POST /demo/reset, POST /demo/ensure
 */
const router = (0, express_1.Router)();
router.post("/demo/reset", async (_req, res, next) => {
    try {
        await (0, resetDemoData_1.resetDemoData)();
        res.json({ ok: true, message: "Demo rows (is_demo=true) cleared and reseeded." });
    }
    catch (e) {
        next(e);
    }
});
router.post("/demo/ensure", async (_req, res, next) => {
    try {
        const result = await (0, demoHealth_1.ensureDemoReady)();
        res.json({
            ok: true,
            resetPerformed: result.resetPerformed,
            skippedLock: result.skippedLock ?? false,
            counts: result.counts,
        });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
