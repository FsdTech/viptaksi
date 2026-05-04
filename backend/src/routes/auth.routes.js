const { Router } = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
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

router.post(
  "/register",
  [
    body("name").trim().notEmpty().isLength({ max: 255 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8, max: 128 }),
    body("role").isIn(["rider", "driver"]),
    body("phone").optional().isString().trim().isLength({ min: 5, max: 32 }),
    body("gsm").optional().isString().trim().isLength({ min: 5, max: 32 }),
    body("vehicle_type_id").optional().isUUID(),
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
  validate,
  authController.login
);

router.post("/refresh", authController.refresh);

module.exports = router;
