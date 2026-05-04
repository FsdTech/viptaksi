"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoMutex = void 0;
/**
 * In-process async mutex for demo critical sections (pairs with Postgres advisory lock).
 */
class DemoMutex {
    constructor() {
        this.locked = false;
        this.waiters = [];
    }
    async acquire() {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        await new Promise((resolve) => {
            this.waiters.push(() => {
                this.locked = true;
                resolve();
            });
        });
    }
    release() {
        const next = this.waiters.shift();
        if (next)
            next();
        else
            this.locked = false;
    }
}
/** Singleton mutex for sales demo write paths. */
exports.demoMutex = new DemoMutex();
