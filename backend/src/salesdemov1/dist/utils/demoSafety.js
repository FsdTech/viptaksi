"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoSafetyError = void 0;
/** Thrown when a model-level operation would wipe the entire demo user or driver population. */
class DemoSafetyError extends Error {
    constructor(message) {
        super(message);
        this.code = "DEMO_SAFETY";
        this.name = "DemoSafetyError";
    }
}
exports.DemoSafetyError = DemoSafetyError;
