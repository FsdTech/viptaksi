const vehicleTypeService = require("../services/vehicleType.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const types = await vehicleTypeService.listAllTypes();
  res.json({ vehicleTypes: types });
});

const bulkUpdate = asyncHandler(async (req, res) => {
  const updated = await vehicleTypeService.updateTypes(req.body);
  res.json({ vehicleTypes: updated });
});

module.exports = { list, bulkUpdate };
