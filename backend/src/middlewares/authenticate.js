const { verifyToken } = require("../utils/jwt.util");
const userModel = require("../models/user.model");
const { AppError } = require("../utils/AppError");
const { asyncHandler } = require("./asyncHandler");
/* ADDED */
const { pool } = require("../db");

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new AppError(401, "Authentication required");
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  // Handle admin tokens (sub format: "admin:123")
  if (payload.admin_id || (payload.sub && payload.sub.startsWith("admin:"))) {
    const adminId = payload.admin_id || payload.sub.split(":")[1];
    const adminResult = await pool.query(
      "SELECT id, name, email, role FROM admins WHERE id = $1",
      [adminId]
    );
    const admin = adminResult.rows[0];
    if (!admin) throw new AppError(401, "Admin no longer exists");

    req.user = {
      id: admin.id,
      role: admin.role || "admin",
      name: admin.name,
      email: admin.email,
      isPanelAdmin: true,
    };
    return next();
  }

  // Handle regular user tokens
  const userId = payload.sub;
  if (!userId) throw new AppError(401, "Invalid token payload");

  const user = await userModel.findById(userId);
  if (!user) throw new AppError(401, "User no longer exists");

  req.user = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    isPanelAdmin: false,
  };
  next();
});

const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return next();
  }
  try {
    const payload = verifyToken(token);
    const userId = payload.sub;
    if (userId) {
      const user = await userModel.findById(userId);
      if (user) {
        req.user = {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        };
      }
    }
  } catch {
    /* ignore */
  }
  next();
});

module.exports = { authenticate, optionalAuthenticate };
