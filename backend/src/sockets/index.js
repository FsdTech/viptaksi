const { Server } = require("socket.io");
const { loadEnv } = require("../config/env");
const { verifyToken } = require("../utils/jwt.util");
const userModel = require("../models/user.model");
const driverModel = require("../models/driver.model");
const { setSocketServer } = require("./realtime.registry");
const realtimeDriverService = require("../services/realtimeDriver.service");
/* EKLENDİ */
const chatService = require("../services/chat.service");
const { AppError } = require("../utils/AppError");

function parseHandshakeToken(socket) {
  const fromAuth = socket.handshake.auth?.token;
  if (typeof fromAuth === "string" && fromAuth) return fromAuth;
  const header = socket.handshake.headers?.authorization || "";
  const [type, token] = header.split(" ");
  if (type === "Bearer" && token) return token;
  return null;
}

function initSocket(httpServer) {
  const { corsOrigins, nodeEnv } = loadEnv();

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins.includes("*") ? true : corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  setSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const token = parseHandshakeToken(socket);
      if (!token) {
        return next(new Error("Unauthorized: missing token"));
      }
      const payload = verifyToken(token);
      const userId = payload.sub;
      if (!userId) return next(new Error("Unauthorized: invalid token"));

      const user = await userModel.findById(userId);
      if (!user) return next(new Error("Unauthorized: user not found"));

      socket.data.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      };
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket.data;
    if (user.role === "admin") {
      socket.join("admin");
    }

    /* EKLENDİ */
    (async () => {
      try {
        if (user.role === "driver") {
          const d = await driverModel.findByUserId(user.id);
          if (d) {
            socket.join(`driver:${d.id}`);
            if (d.vehicle_type_id) {
              socket.join(`vt:${d.vehicle_type_id}`);
            }
          }
        }
        if (user.role === "rider") {
          socket.join(`rider:${user.id}`);
        }
      } catch (e) {
        if (nodeEnv !== "production") console.error("socket room join", e);
      }
    })();

    /* EKLENDİ */
    socket.on("chat:send", async (payload, ack) => {
      try {
        const text = payload?.message ?? payload?.text;
        const result = await chatService.sendMessage({
          user,
          conversationId: payload?.conversation_id ?? payload?.conversationId,
          text,
          driverId: payload?.driver_id ?? payload?.driverId,
          riderUserId: payload?.rider_user_id ?? payload?.riderUserId,
        });
        if (typeof ack === "function") ack({ ok: true, ...result });
      } catch (e) {
        const msg = e instanceof AppError ? e.message : "Send failed";
        if (nodeEnv !== "production") console.error("chat:send", e);
        if (typeof ack === "function") ack({ error: msg });
      }
    });

    /* EKLENDİ */
    socket.on("chat:mark-read", async (payload, ack) => {
      try {
        const cid = payload?.conversation_id ?? payload?.conversationId;
        if (!cid) {
          if (typeof ack === "function") ack({ error: "conversation_id required" });
          return;
        }
        const result = await chatService.markRead(user, cid);
        if (typeof ack === "function") ack({ ok: true, ...result });
      } catch (e) {
        const msg = e instanceof AppError ? e.message : "Mark read failed";
        if (typeof ack === "function") ack({ error: msg });
      }
    });

    socket.on("driver:location:update", async (payload, ack) => {
      try {
        if (user.role !== "driver") {
          const err = { error: "Only drivers may emit driver:location:update" };
          if (typeof ack === "function") ack(err);
          return;
        }
        const lat = Number(payload?.lat);
        const lng = Number(payload?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          const err = { error: "lat and lng are required numbers" };
          if (typeof ack === "function") ack(err);
          return;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          const err = { error: "lat/lng out of range" };
          if (typeof ack === "function") ack(err);
          return;
        }

        const driver = await driverModel.findByUserId(user.id);
        if (!driver) {
          const err = { error: "Driver profile not found" };
          if (typeof ack === "function") ack(err);
          return;
        }

        const updated = await driverModel.updateLocation(driver.id, lat, lng);
        await realtimeDriverService.broadcastAdminDriversUpdate();

        if (typeof ack === "function") {
          ack({ ok: true, driver: updated });
        }
      } catch (e) {
        if (nodeEnv !== "production") {
          console.error("driver:location:update error", e);
        }
        if (typeof ack === "function") {
          ack({ error: "Failed to update location" });
        }
      }
    });
  });

  return io;
}

module.exports = { initSocket };
