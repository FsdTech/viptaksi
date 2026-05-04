const { Router } = require("express");
const vehicleTypeController = require("../controllers/vehicleType.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");
const { validateVehicleTypeUpdates } = require("../middlewares/validateVehicleTypeUpdates");

const router = Router();

router.get("/", vehicleTypeController.list);

router.put(
  "/update",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  validateVehicleTypeUpdates,
  vehicleTypeController.bulkUpdate
);

module.exports = router;
