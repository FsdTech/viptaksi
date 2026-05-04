"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoMiddleware = exports.ensureDemoOnFirstAccess = void 0;
/**
 * Single import surface for deployment wiring (optional; not integrated into main backend).
 */
var demoEntry_1 = require("./utils/demoEntry");
Object.defineProperty(exports, "ensureDemoOnFirstAccess", { enumerable: true, get: function () { return demoEntry_1.ensureDemoOnFirstAccess; } });
var demoMiddleware_1 = require("./api/demoMiddleware");
Object.defineProperty(exports, "demoMiddleware", { enumerable: true, get: function () { return demoMiddleware_1.demoMiddleware; } });
