/**
 * Single import surface for deployment wiring (optional; not integrated into main backend).
 */
export { ensureDemoOnFirstAccess } from "./utils/demoEntry";
export { demoMiddleware } from "./api/demoMiddleware";
