const authService = require("../services/auth.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body || {});
  res.json(result);
});

module.exports = { register, login, refresh };
