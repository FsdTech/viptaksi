const userModel = require("../models/user.model");
const driverModel = require("../models/driver.model");
const vehicleTypeModel = require("../models/vehicleType.model");
const { hashPassword, verifyPassword } = require("../utils/password.util");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/jwt.util");
const { AppError } = require("../utils/AppError");
/* ADDED */
const { pool } = require("../db");

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone ?? null, role: row.role };
}

async function register({ name, email, password, role, vehicleTypeId, phone, gsm }) {
  const existing = await userModel.findByEmail(email);
  if (existing) throw new AppError(409, "Email already registered");

  if (role === "admin") {
    throw new AppError(403, "Admin accounts cannot be created via public registration");
  }

  const passwordHash = await hashPassword(password);
  const phoneRaw = phone ?? gsm ?? null;
  const normalizedPhone = typeof phoneRaw === "string" ? phoneRaw.trim() : null;
  const user = await userModel.create({
    name,
    email,
    phone: normalizedPhone || null,
    passwordHash,
    role,
  });

  if (role === "driver") {
    if (!vehicleTypeId) {
      const normal = await vehicleTypeModel.findByName("Normal");
      if (!normal) throw new AppError(500, "Default vehicle type missing; run DB seed/schema");
      await driverModel.create({ userId: user.id, vehicleTypeId: normal.id });
    } else {
      const vt = await vehicleTypeModel.findById(vehicleTypeId);
      if (!vt) throw new AppError(400, "Invalid vehicle_type_id");
      await driverModel.create({ userId: user.id, vehicleTypeId });
    }
  }

  const token = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token, refreshToken };
}

async function login({ email, password }) {
  /* ADDED */
  const adminResult = await pool.query(
    `
      SELECT id, name, email, role, status, password_hash
      FROM admins
      WHERE email = $1
      LIMIT 1
    `,
    [email]
  );
  /* ADDED */
  const admin = adminResult.rows[0];
  /* ADDED */
  if (admin) {
    const adminPasswordOk = await verifyPassword(password, admin.password_hash || "");
    if (!adminPasswordOk) throw new AppError(401, "Invalid credentials");
    /* ADDED */
    await pool.query(
      "INSERT INTO admin_sessions (admin_id, is_active) VALUES ($1, true)",
      [admin.id]
    );
    const token = signAccessToken({
      sub: `admin:${admin.id}`,
      role: "admin",
      admin_id: admin.id,
    });
    const refreshToken = signRefreshToken({
      sub: `admin:${admin.id}`,
      role: "admin",
      admin_id: admin.id,
    });
    return {
      user: {
        id: String(admin.id),
        name: admin.name,
        email: admin.email,
        role: admin.role || "yonetici",
      },
      token,
      refreshToken,
    };
  }

  /* ADDED */
  let user = null;
  try {
    user = await userModel.findByEmail(email);
  } catch (error) {
    console.error("User table login fallback error:", error);
  }
  if (!user) throw new AppError(401, "Invalid credentials");
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new AppError(401, "Invalid credentials");
  const token = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  return { user: toPublicUser(user), token, refreshToken };
}

async function refresh({ refreshToken: refreshTokenStr }) {
  if (!refreshTokenStr || typeof refreshTokenStr !== "string") {
    throw new AppError(400, "refreshToken is required");
  }
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenStr);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  if (payload.admin_id != null) {
    const adminResult = await pool.query(
      "SELECT id, name, email, role, status FROM admins WHERE id = $1 LIMIT 1",
      [payload.admin_id]
    );
    const admin = adminResult.rows[0];
    if (!admin) throw new AppError(401, "Admin no longer exists");
    const token = signAccessToken({
      sub: `admin:${admin.id}`,
      role: "admin",
      admin_id: admin.id,
    });
    return { token };
  }

  const userId = payload.sub;
  if (!userId || String(userId).startsWith("admin:")) {
    throw new AppError(401, "Invalid refresh token");
  }
  const user = await userModel.findById(userId);
  if (!user) throw new AppError(401, "User no longer exists");
  const token = signAccessToken({ sub: user.id, role: user.role });
  return { token };
}

module.exports = { register, login, refresh, toPublicUser };
