const driverService = require("../services/driver.service");
const realtimeDriverService = require("../services/realtimeDriver.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const drivers = await driverService.listDrivers();
  res.json({ drivers });
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  const row = await driverService.updateLocationForUser(req.user.id, lat, lng);
  await realtimeDriverService.broadcastAdminDriversUpdate();
  res.json({ driver: row });
});

const toggleOnline = asyncHandler(async (req, res) => {
  const { is_online: isOnline } = req.body;
  const row = await driverService.toggleOnlineForUser(req.user.id, isOnline);
  await realtimeDriverService.broadcastAdminDriversUpdate();
  res.json({ driver: row });
});

const detail = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);
  res.json({ driver });
});

const updateDetail = asyncHandler(async (req, res) => {
  const driver = await driverService.updateDriverById(req.params.id, req.body || {});
  await realtimeDriverService.broadcastAdminDriversUpdate();
  res.json({ driver });
});

const createByAdmin = asyncHandler(async (req, res) => {
  const driver = await driverService.createDriverByAdmin(req.body || {});
  await realtimeDriverService.broadcastAdminDriversUpdate();
  res.status(201).json({ driver });
});

module.exports = { list, updateLocation, toggleOnline, detail, updateDetail, createByAdmin };
