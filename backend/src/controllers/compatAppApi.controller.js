const { asyncHandler } = require("../middlewares/asyncHandler");
const compatAppApiService = require("../services/compatAppApi.service");

const socialLogin = asyncHandler(async (req, res) => {
  const payload = await compatAppApiService.socialLogin(req.body || {});
  res.status(200).json(payload);
});

const appLogin = asyncHandler(async (req, res) => {
  const payload = await compatAppApiService.appEmailLogin(req.body || {});
  res.status(200).json(payload);
});

module.exports = { socialLogin, appLogin };
