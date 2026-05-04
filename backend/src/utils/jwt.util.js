const jwt = require("jsonwebtoken");
const { loadEnv } = require("../config/env");

function signToken(payload) {
  const { jwtSecret, jwtExpiresIn } = loadEnv();
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

/** Short-lived access token for mobile / SPA clients */
function signAccessToken(payload) {
  const { jwtSecret, jwtAccessExpiresIn } = loadEnv();
  return jwt.sign({ ...payload, typ: "access" }, jwtSecret, { expiresIn: jwtAccessExpiresIn });
}

/** Long-lived refresh token */
function signRefreshToken(payload) {
  const { jwtSecret, jwtRefreshExpiresIn } = loadEnv();
  return jwt.sign({ ...payload, typ: "refresh" }, jwtSecret, { expiresIn: jwtRefreshExpiresIn });
}

function verifyToken(token) {
  const { jwtSecret } = loadEnv();
  return jwt.verify(token, jwtSecret);
}

function verifyRefreshToken(token) {
  const { jwtSecret } = loadEnv();
  const decoded = jwt.verify(token, jwtSecret);
  if (decoded.typ !== "refresh") {
    const err = new Error("Not a refresh token");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded;
}

module.exports = { signToken, signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken };
