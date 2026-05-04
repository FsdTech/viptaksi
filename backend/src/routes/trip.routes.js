const { Router } = require("express");
const { body } = require("express-validator");
const tripController = require("../controllers/trip.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { AppError } = require("../utils/AppError");

const router = Router();

const allowRiderOrDriver = (req, res, next) => {
  if (!req.user) return next(new AppError(401, "Authentication required"));
  if (req.user.role !== "rider" && req.user.role !== "driver") {
    return next(new AppError(403, "Rider or driver only"));
  }
  next();
};

const validate = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(400, "Validation failed", errors.array()));
  }
  next();
};

router.get("/", authenticate, authorizePanel, tripController.list);

router.get("/mine", authenticate, allowRiderOrDriver, tripController.mine);

router.get("/pending", authenticate, authorize("driver"), tripController.pending);

router.post(
  "/create",
  authenticate,
  authorize("rider"),
  [
    body("vehicle_type_id").isUUID(),
    body("start_lat").isFloat({ min: -90, max: 90 }),
    body("start_lng").isFloat({ min: -180, max: 180 }),
    body("end_lat").isFloat({ min: -90, max: 90 }),
    body("end_lng").isFloat({ min: -180, max: 180 }),
    body("estimated_duration_min").isFloat({ min: 0 }),
  ],
  validate,
  tripController.create
);

router.post(
  "/accept",
  authenticate,
  authorize("driver"),
  [body("trip_id").isUUID()],
  validate,
  tripController.accept
);

router.post(
  "/complete",
  authenticate,
  authorize("driver"),
  [
    body("trip_id").isUUID(),
    body("actual_duration_min").optional().isFloat({ min: 0 }),
    body("end_lat").optional().isFloat({ min: -90, max: 90 }),
    body("end_lng").optional().isFloat({ min: -180, max: 180 }),
  ],
  validate,
  tripController.complete
);

router.post(
  "/cancel",
  authenticate,
  authorize("rider"),
  [body("trip_id").isUUID()],
  validate,
  tripController.cancel
);

router.post(
  "/start",
  authenticate,
  authorize("driver"),
  [body("trip_id").isUUID()],
  validate,
  tripController.start
);

module.exports = router;
