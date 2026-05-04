const paymentModel = require("../models/payment.model");
const { AppError } = require("../utils/AppError");
const driverModel = require("../models/driver.model");

function mapPaymentRow(r) {
  return {
    id: r.id,
    driverId: r.driver_id,
    amount: Number(r.amount),
    status: r.status,
    planType: r.plan_type || "monthly",
    receiptUrl: r.receipt_url || null,
    expireAt: r.expire_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    driver: {
      userId: r.driver_user_id,
      name: r.driver_name,
      email: r.driver_email,
    },
  };
}

async function listPayments() {
  const rows = await paymentModel.listWithDriver();
  return rows.map(mapPaymentRow);
}

async function approvePayment({ paymentId, expireAt, defaultValidityDays }) {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new AppError(404, "Payment not found");
  if (payment.status !== "pending") {
    throw new AppError(409, "Only pending payments can be approved");
  }

  let expiry = expireAt ? new Date(expireAt) : null;
  if (!expiry || Number.isNaN(expiry.getTime())) {
    const autoDays = payment.plan_type === "weekly" ? 7 : 30;
    const days = Number(defaultValidityDays) > 0 ? Number(defaultValidityDays) : autoDays;
    expiry = new Date();
    expiry.setUTCDate(expiry.getUTCDate() + days);
  }

  const updated = await paymentModel.approve(paymentId, expiry);
  if (!updated) throw new AppError(409, "Payment could not be approved");
  return updated;
}

async function rejectPayment(paymentId) {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new AppError(404, "Payment not found");
  const updated = await paymentModel.reject(paymentId);
  if (!updated) throw new AppError(409, "Payment could not be rejected");
  return updated;
}

async function resetPayment(paymentId) {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new AppError(404, "Payment not found");
  const updated = await paymentModel.resetToPending(paymentId);
  if (!updated) throw new AppError(409, "Payment could not be reset");
  return updated;
}

async function updatePaymentMeta({ paymentId, planType, amount, receiptUrl }) {
  const payment = await paymentModel.findById(paymentId);
  if (!payment) throw new AppError(404, "Payment not found");
  const updated = await paymentModel.updateMeta(paymentId, { planType, amount, receiptUrl });
  if (!updated) throw new AppError(409, "Payment could not be updated");
  return updated;
}

async function submitPaymentByDriver({ userId, planType, receiptUrl }) {
  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  const normalizedPlan = planType === "weekly" ? "weekly" : "monthly";
  const amount = normalizedPlan === "weekly" ? 2000 : 6000;
  const created = await paymentModel.create({
    driverId: driver.id,
    amount,
    status: "pending",
    expireAt: null,
    planType: normalizedPlan,
    receiptUrl: receiptUrl || null,
  });
  return created;
}

module.exports = {
  listPayments,
  approvePayment,
  rejectPayment,
  resetPayment,
  updatePaymentMeta,
  submitPaymentByDriver,
  mapPaymentRow,
};
