import { Router } from "express";
import { ensureDemoReady } from "../utils/demoHealth";
import { resetDemoData } from "../utils/resetDemoData";

/**
 * Standalone Express router — NOT wired into the main backend.
 * Mount in a small local server, e.g.:
 *   import demo from './salesdemov1/api/demo';
 *   app.use(demo);
 * Then: POST /demo/reset, POST /demo/ensure
 */
const router = Router();

router.post("/demo/reset", async (_req, res, next) => {
  try {
    await resetDemoData();
    res.json({ ok: true, message: "Demo rows (is_demo=true) cleared and reseeded." });
  } catch (e) {
    next(e);
  }
});

router.post("/demo/ensure", async (_req, res, next) => {
  try {
    const result = await ensureDemoReady();
    res.json({
      ok: true,
      resetPerformed: result.resetPerformed,
      skippedLock: result.skippedLock ?? false,
      counts: result.counts,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
