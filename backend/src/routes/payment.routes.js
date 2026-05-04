const { Router } = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/payment.controller");
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

const requireSuperAdminOrDemoApprove = (req, res, next) => {
  if (!req.user?.isPanelAdmin) {
    return next(new AppError(401, "Kimlik dogrulama gerekli"));
  }
  const email = String(req.user?.email || "").toLowerCase();
  if (req.user.role === "super_admin" || email === "demo@user.com") {
    return next();
  }
  return next(new AppError(403, "This operation is restricted to Super Admins"));
};

router.get("/", authenticate, authorizePanel, paymentController.list);

router.post(
  "/submit",
  authenticate,
  authorize("driver"),
  [
    body("plan_type").isIn(["weekly", "monthly"]),
    body("receipt_url").isURL(),
  ],
  validate,
  paymentController.submit
);

router.post(
  "/approve",
  authenticate,
  authorizePanel,
  requireSuperAdminOrDemoApprove,
  [
    body("payment_id").isUUID(),
    body("expire_at").optional().isISO8601(),
    body("validity_days").optional().isInt({ min: 1, max: 3650 }),
  ],
  validate,
  paymentController.approve
);

router.post(
  "/reject",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  [body("payment_id").isUUID()],
  validate,
  paymentController.reject
);

router.post(
  "/update-meta",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  [
    body("payment_id").isUUID(),
    body("plan_type").optional().isIn(["weekly", "monthly"]),
    body("amount").optional().isFloat({ min: 0 }),
    body("receipt_url").optional().isString(),
  ],
  validate,
  paymentController.updateMeta
);

router.post(
  "/reset",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  [body("payment_id").isUUID()],
  validate,
  paymentController.reset
);

module.exports = router;
