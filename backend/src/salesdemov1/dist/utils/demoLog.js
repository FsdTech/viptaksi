"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoLog = demoLog;
function demoLog(channel, message, ...extra) {
    const suffix = extra.length ? ` ${JSON.stringify(extra)}` : "";
    console.log(`[DEMO][${channel}] ${message}${suffix}`);
}
