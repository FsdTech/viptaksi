"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoMiddleware = void 0;
const demoEntry_1 = require("../utils/demoEntry");
/**
 * Optional Express middleware — mount manually on a demo-facing app.
 * Ensures demo data once per process (see {@link ensureDemoOnFirstAccess}).
 */
const demoMiddleware = async (_req, _res, next) => {
    try {
        await (0, demoEntry_1.ensureDemoOnFirstAccess)();
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.demoMiddleware = demoMiddleware;
