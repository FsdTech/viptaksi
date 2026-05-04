const paymentService = require("../services/payment.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const payments = await paymentService.listPayments();
  res.json({ payments });
});

const approve = asyncHandler(async (req, res) => {
  const {
    payment_id: paymentId,
    expire_at: expireAt,
    validity_days: validityDays,
  } = req.body;
  const payment = await paymentService.approvePayment({
    paymentId,
    expireAt,
    defaultValidityDays: validityDays,
  });
  res.json({ payment });
});

const reject = asyncHandler(async (req, res) => {
  const { payment_id: paymentId } = req.body;
  const payment = await paymentService.rejectPayment(paymentId);
  res.json({ payment });
});

const reset = asyncHandler(async (req, res) => {
  const { payment_id: paymentId } = req.body;
  const payment = await paymentService.resetPayment(paymentId);
  res.json({ payment });
});

const updateMeta = asyncHandler(async (req, res) => {
  const {
    payment_id: paymentId,
    plan_type: planType,
    amount,
    receipt_url: receiptUrl,
  } = req.body;
  const payment = await paymentService.updatePaymentMeta({
    paymentId,
    planType,
    amount,
    receiptUrl,
  });
  res.json({ payment });
});

const submit = asyncHandler(async (req, res) => {
  const { plan_type: planType, receipt_url: receiptUrl } = req.body;
  const payment = await paymentService.submitPaymentByDriver({
    userId: req.user.id,
    planType,
    receiptUrl,
  });
  res.status(201).json({ payment });
});

module.exports = { list, approve, reject, reset, updateMeta, submit };
