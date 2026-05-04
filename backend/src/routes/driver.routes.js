const { Router } = require("express");
const { body } = require("express-validator");
const driverController = require("../controllers/driver.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");
const { AppError } = require("../utils/AppError");

const router = Router();

const validate = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(400, "Validation failed", errors.array()));
  }
  next();
};

router.get("/", authenticate, authorizePanel, driverController.list);
router.post("/", authenticate, authorizePanel, requireSuperAdmin, driverController.createByAdmin);
router.get("/:id", authenticate, authorizePanel, driverController.detail);
router.put("/:id", authenticate, authorizePanel, requireSuperAdmin, driverController.updateDetail);

router.post(
  "/update-location",
  authenticate,
  authorize("driver"),
  [
    body("lat").isFloat({ min: -90, max: 90 }),
    body("lng").isFloat({ min: -180, max: 180 }),
  ],
  validate,
  driverController.updateLocation
);

router.post(
  "/toggle-online",
  authenticate,
  authorize("driver"),
  [body("is_online").optional().isBoolean()],
  validate,
  driverController.toggleOnline
);

module.exports = router;
