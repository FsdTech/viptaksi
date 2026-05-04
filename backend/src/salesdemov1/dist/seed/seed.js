"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = require("../db/connection");
const demoGuard_1 = require("../utils/demoGuard");
const demoLog_1 = require("../utils/demoLog");
const schemaGuard_1 = require("../utils/schemaGuard");
const userModel_1 = require("../models/userModel");
const driverModel_1 = require("../models/driverModel");
const tripModel_1 = require("../models/tripModel");
const paymentModel_1 = require("../models/paymentModel");
const RIDERS = 50;
const DRIVERS = 20;
const TRIPS = 120;
const PAYMENTS = 40;
const FIRST = [
    "Ahmet", "Mehmet", "Ayşe", "Fatma", "Can", "Elif", "Burak", "Zeynep", "Emre", "Selin",
    "David", "Emma", "James", "Olivia", "Daniel", "Sophia", "Michael", "Isabella",
];
const LAST = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Wilson", "Brown", "Davis", "Miller", "Garcia",
];
const CITIES = [
    { lat: 41.0082, lng: 28.9784, name: "Istanbul" },
    { lat: 39.9334, lng: 32.8597, name: "Ankara" },
    { lat: 38.4237, lng: 27.1428, name: "Izmir" },
    { lat: 36.8969, lng: 30.7133, name: "Antalya" },
];
function mulberry32(seed) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}
async function ensurePaymentCompat() {
    await (0, connection_1.query)(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'monthly'`);
    await (0, connection_1.query)(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT`);
}
async function runSeed() {
    (0, demoGuard_1.assertDemoEnvironment)();
    if ((0, demoGuard_1.isDemoDryRun)()) {
        (0, demoLog_1.demoLog)("RESET", "Dry run: would ensure schema compat, then insert demo riders/drivers/trips/payments");
        return;
    }
    await (0, schemaGuard_1.ensureDemoColumns)();
    await ensurePaymentCompat();
    const rng = mulberry32(((Date.now() >>> 0) ^ (Math.floor(Math.random() * 0xffffffff) >>> 0) ^ 0x9e3779b9) >>> 0);
    const passwordHash = await bcryptjs_1.default.hash("Demo123!", 10);
    const now = Date.now();
    const vtRows = await (0, connection_1.query)(`SELECT id, LOWER(name) AS key FROM vehicle_types WHERE is_active = TRUE`);
    const vt = {};
    for (const r of vtRows.rows)
        vt[r.key] = r.id;
    const vtKeys = ["normal", "premium", "vip", "motor"];
    for (const k of vtKeys) {
        if (!vt[k])
            throw new Error(`Missing vehicle_types row for "${k}" — run main schema seed first.`);
    }
    const msPerDay = 86400000;
    const windowDays = 30;
    await (0, connection_1.withTransaction)(async (client) => {
        const riderIds = [];
        for (let i = 0; i < RIDERS; i++) {
            const fn = pick(rng, FIRST);
            const ln = pick(rng, LAST);
            const email = `salesdemo.rider${i + 1}@salesdemov1.local`.toLowerCase();
            const phone = `+90 5${30 + (i % 60)} ${100 + (i % 899)} ${String(1000 + i).slice(-4)}`;
            const { id } = await (0, userModel_1.insertDemoUser)(client, {
                name: `${fn} ${ln}`,
                email,
                phone,
                passwordHash,
                role: "rider",
            });
            riderIds.push(id);
        }
        const driverRows = [];
        for (let i = 0; i < DRIVERS; i++) {
            const fn = pick(rng, FIRST);
            const ln = pick(rng, LAST);
            const email = `salesdemo.driver${i + 1}@salesdemov1.local`.toLowerCase();
            const phone = `+90 5${40 + (i % 50)} ${200 + (i % 799)} ${String(3000 + i).slice(-4)}`;
            const { id: userId } = await (0, userModel_1.insertDemoUser)(client, {
                name: `${fn} ${ln}`,
                email,
                phone,
                passwordHash,
                role: "driver",
            });
            const city = CITIES[i % CITIES.length];
            const lat = city.lat + (rng() - 0.5) * 0.2;
            const lng = city.lng + (rng() - 0.5) * 0.2;
            const vtKey = vtKeys[i % vtKeys.length];
            const onlineBias = 0.25 + rng() * 0.55;
            const { id: driverId } = await (0, driverModel_1.insertDemoDriver)(client, {
                userId,
                vehicleTypeId: vt[vtKey],
                isOnline: rng() > onlineBias,
                lat,
                lng,
                rating: (3.6 + rng() * 1.35).toFixed(2),
            });
            driverRows.push({ userId, driverId });
        }
        const nCompleted = Math.min(TRIPS - 8, Math.floor(48 + rng() * 38));
        const nCancelled = Math.min(TRIPS - nCompleted - 4, Math.floor(10 + rng() * 22));
        const nActive = Math.min(TRIPS - nCompleted - nCancelled, Math.floor(6 + rng() * 16));
        const tripMix = [];
        for (let i = 0; i < nCompleted; i++)
            tripMix.push("completed");
        for (let i = 0; i < nCancelled; i++)
            tripMix.push("cancelled");
        for (let i = 0; i < nActive; i++)
            tripMix.push(rng() > 0.55 ? "in_progress" : "accepted");
        while (tripMix.length < TRIPS)
            tripMix.push("pending");
        for (let i = tripMix.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [tripMix[i], tripMix[j]] = [tripMix[j], tripMix[i]];
        }
        for (let t = 0; t < TRIPS; t++) {
            const st = tripMix[t];
            const riderId = pick(rng, riderIds);
            const city = pick(rng, CITIES);
            const dist = 2 + rng() * 25;
            const dur = 10 + rng() * 40;
            const price = Math.round(90 + rng() * 280 + dist * 5);
            const vtId = vt[pick(rng, vtKeys)];
            const driverId = st === "pending" ? null : pick(rng, driverRows).driverId;
            const dayOffset = rng() * windowDays;
            const createdAt = new Date(now - dayOffset * msPerDay - rng() * msPerDay);
            let completedAt = null;
            let actualMin = null;
            if (st === "completed") {
                actualMin = Math.max(8, dur + (rng() - 0.5) * 6).toFixed(2);
                completedAt = new Date(createdAt.getTime() + dur * 60000);
            }
            await (0, tripModel_1.insertDemoTrip)(client, {
                driverId,
                riderId,
                vehicleTypeId: vtId,
                status: st,
                startLat: city.lat + (rng() - 0.5) * 0.08,
                startLng: city.lng + (rng() - 0.5) * 0.08,
                endLat: city.lat + (rng() - 0.5) * 0.12,
                endLng: city.lng + (rng() - 0.5) * 0.12,
                distanceKm: dist.toFixed(3),
                durationMin: dur.toFixed(2),
                actualDurationMin: actualMin,
                price,
                createdAt,
                completedAt,
            });
        }
        function rollPaymentStatus() {
            const r = rng();
            if (r < 0.62)
                return "approved";
            if (r < 0.82)
                return "pending";
            return "rejected";
        }
        for (let p = 0; p < PAYMENTS; p++) {
            const d = driverRows[p % driverRows.length];
            const st = rollPaymentStatus();
            const plan = rng() > 0.28 ? "monthly" : "weekly";
            const amount = plan === "monthly" ? 5500 + Math.floor(rng() * 900) : 1800 + Math.floor(rng() * 500);
            const payDayOffset = rng() * windowDays;
            const createdAt = new Date(now - payDayOffset * msPerDay - rng() * msPerDay);
            const days = st === "approved" ? 10 + Math.floor(rng() * 20) : null;
            const expireAt = st === "approved" ? new Date(createdAt.getTime() + (days ?? 20) * 86400000) : null;
            const receiptUrl = `https://dummyimage.com/800x200/111/f5b700&text=${encodeURIComponent(`Demo-${p + 1}`)}`;
            await (0, paymentModel_1.insertDemoPayment)(client, {
                driverId: d.driverId,
                amount,
                status: st,
                expireAt,
                createdAt,
                planType: plan,
                receiptUrl,
            });
        }
    });
}
