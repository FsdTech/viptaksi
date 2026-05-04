const crypto = require("crypto");
const userModel = require("../models/user.model");
const driverModel = require("../models/driver.model");
const vehicleTypeModel = require("../models/vehicleType.model");
const { hashPassword, verifyPassword } = require("../utils/password.util");
const { signToken } = require("../utils/jwt.util");
const { AppError } = require("../utils/AppError");

/**
 * Flutter apps (Mighty-style) expect POST /api/social-login and a JSON body
 * shaped like { data: { ...user..., api_token }, message }.
 */
function buildAppLoginPayload(user, token, { loginType, firebaseUid, playerId }) {
  const fullName = (user.name || "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || (user.email || "").split("@")[0] || "User";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return {
    message: "Login successful",
    data: {
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email,
      contact_number: user.phone || "",
      country_code: "",
      username: user.email,
      gender: "",
      email_verified_at: null,
      address: "",
      user_type: user.role,
      player_id: playerId || "",
      fleet_id: "",
      latitude: "",
      longitude: "",
      last_notification_seen: "",
      status: "active",
      is_online: 0,
      uid: firebaseUid || "",
      display_name: fullName || firstName,
      login_type: loginType || "google",
      timezone: "UTC",
      created_at: user.created_at,
      updated_at: user.updated_at,
      api_token: token,
      profile_image: "",
      is_verified_driver: user.role === "driver" ? 0 : 0,
      user_bank_account: null,
    },
  };
}

async function socialLogin(body) {
  const email = (body.email || "").trim().toLowerCase();
  if (!email) {
    throw new AppError(400, "Email is required");
  }

  const userType = String(body.user_type || "rider").toLowerCase();
  if (userType !== "rider" && userType !== "driver") {
    throw new AppError(400, "Invalid user_type");
  }

  const firebaseUid = String(body.uid || "").trim();
  const playerId = String(body.player_id || "").trim();
  const loginType = String(body.login_type || "google").trim() || "google";

  let user = await userModel.findByEmail(email);

  if (!user) {
    const rawFirst = String(body.first_name || "").trim();
    const rawLast = String(body.last_name || "").trim();
    const name =
      [rawFirst, rawLast].filter(Boolean).join(" ") ||
      (email.includes("@") ? email.split("@")[0] : "User");
    const randomPass = await hashPassword(crypto.randomBytes(32).toString("hex"));
    user = await userModel.create({
      name,
      email,
      phone: body.contact_number ? String(body.contact_number).trim() : null,
      passwordHash: randomPass,
      role: userType,
    });

    if (userType === "driver") {
      const normal = await vehicleTypeModel.findByName("Normal");
      if (!normal) {
        throw new AppError(500, "Default vehicle type missing; run DB seed/schema");
      }
      await driverModel.create({ userId: user.id, vehicleTypeId: normal.id });
    }
  } else if (user.role !== userType) {
    throw new AppError(
      403,
      "This email is already registered with a different account type"
    );
  }

  const token = signToken({ sub: user.id, role: user.role });
  return buildAppLoginPayload(user, token, {
    loginType,
    firebaseUid,
    playerId,
  });
}

/** Mighty-style POST /api/login (email + password + user_type). */
async function appEmailLogin(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const userType = String(body.user_type || "rider").toLowerCase();
  const playerId = String(body.player_id || "").trim();

  if (!email || !password) {
    throw new AppError(400, "Email and password are required");
  }
  if (userType !== "rider" && userType !== "driver") {
    throw new AppError(400, "Invalid user_type");
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new AppError(401, "Invalid credentials");
  }
  const ok = await verifyPassword(password, user.password_hash || "");
  if (!ok) {
    throw new AppError(401, "Invalid credentials");
  }
  if (user.role !== userType) {
    throw new AppError(403, "This account type does not match this app");
  }

  const token = signToken({ sub: user.id, role: user.role });
  return buildAppLoginPayload(user, token, {
    loginType: "app",
    firebaseUid: "",
    playerId,
  });
}

module.exports = { socialLogin, appEmailLogin };
