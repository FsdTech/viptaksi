import type { RequestHandler } from "express";
import { ensureDemoOnFirstAccess } from "../utils/demoEntry";

/**
 * Optional Express middleware — mount manually on a demo-facing app.
 * Ensures demo data once per process (see {@link ensureDemoOnFirstAccess}).
 */
export const demoMiddleware: RequestHandler = async (_req, _res, next) => {
  try {
    await ensureDemoOnFirstAccess();
    next();
  } catch (err) {
    next(err);
  }
};
