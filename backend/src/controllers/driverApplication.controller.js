const { pool } = require("../db");
const { asyncHandler } = require("../middlewares/asyncHandler");

const submit = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const plate = String(body.plate || "").trim().toUpperCase();
  const vehicle = String(body.vehicle || "").trim();
  const vehicleType = String(body.vehicle_type || "normal").trim().toLowerCase();
  const licenseImage = String(body.license_image || "").trim();
  const receiptUrl = String(body.receipt_url || "").trim();

  if (!name || !phone || !plate || !vehicle) {
    res.status(400).json({ message: "name, phone, plate and vehicle are required" });
    return;
  }

  const result = await pool.query(
    `
      INSERT INTO driver_applications (
        name, phone, plate, vehicle, vehicle_type, license_image, receipt_url, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING id, status, created_at
    `,
    [name, phone, plate, vehicle, vehicleType, licenseImage, receiptUrl]
  );

  res.status(201).json({ application: result.rows[0] });
});

module.exports = { submit };
