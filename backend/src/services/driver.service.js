const driverModel = require("../models/driver.model");
const { AppError } = require("../utils/AppError");
const { deactivateExpiredDrivers } = require("./paymentExpiry.service");
const userModel = require("../models/user.model");
const vehicleTypeModel = require("../models/vehicleType.model");
const paymentModel = require("../models/payment.model");
const { hashPassword } = require("../utils/password.util");

function mapDriverRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    vehicleTypeId: r.vehicle_type_id,
    isOnline: r.is_online,
    lat: r.lat,
    lng: r.lng,
    rating: r.rating != null ? Number(r.rating) : null,
    phone: r.phone ?? null,
    plate: r.plate ?? null,
    vehicle: r.vehicle ?? null,
    licenseNo: r.license_no ?? null,
    status: r.status ?? "active",
    user: {
      name: r.user_name,
      email: r.user_email,
    },
    vehicleType: {
      name: r.vehicle_type_name,
      baseFare: r.base_fare != null ? Number(r.base_fare) : null,
      perKmRate: r.per_km_rate != null ? Number(r.per_km_rate) : null,
      perMinRate: r.per_min_rate != null ? Number(r.per_min_rate) : null,
    },
    payment: r.payment_id
      ? {
          id: r.payment_id,
          status: r.payment_status,
          amount: r.payment_amount != null ? Number(r.payment_amount) : null,
          planType: r.payment_plan_type || "monthly",
          expireAt: r.payment_expire_at,
        }
      : null,
  };
}

async function listDrivers() {
  await deactivateExpiredDrivers();
  const rows = await driverModel.listWithUserAndVehicleType();
  return rows.map(mapDriverRow);
}

async function updateLocationForUser(userId, lat, lng) {
  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  const updated = await driverModel.updateLocation(driver.id, lat, lng);
  return updated;
}

async function toggleOnlineForUser(userId, isOnline) {
  const driver = await driverModel.findByUserId(userId);
  if (!driver) throw new AppError(404, "Driver profile not found");
  if (String(driver.status || "active") !== "active") {
    throw new AppError(409, "Only active accounts can go online");
  }
  const next =
    typeof isOnline === "boolean" ? isOnline : !driver.is_online;
  const updated = await driverModel.setOnline(driver.id, next);
  return updated;
}

async function getDriverById(driverId) {
  const row = await driverModel.findDetailedById(driverId);
  if (!row) throw new AppError(404, "Driver not found");
  return mapDriverRow(row);
}

async function updateDriverById(driverId, payload) {
  const incomingLicense = String(payload?.license_no ?? "").trim();
  if (incomingLicense) {
    const exists = await driverModel.findByLicenseNoExceptId(incomingLicense, driverId);
    if (exists) throw new AppError(409, "This license number is already in use");
  }
  const updated = await driverModel.updateDetailsById(driverId, payload);
  if (!updated) throw new AppError(404, "Driver not found");
  const row = await driverModel.findDetailedById(driverId);
  if (!row) throw new AppError(404, "Driver not found");
  return mapDriverRow(row);
}

async function createDriverByAdmin(payload) {
  const {
    name,
    email,
    phone,
    plate,
    vehicle,
    license_no: licenseNo,
    vehicle_type_id: vehicleTypeId,
  } = payload;

  if (!name || !email || !plate || !vehicle || !vehicleTypeId) {
    throw new AppError(400, "name, email, plate, vehicle and vehicle_type_id are required");
  }

  const existing = await userModel.findByEmail(email);
  if (existing) throw new AppError(409, "Email already exists");
  if (String(licenseNo ?? "").trim()) {
    const existingLicense = await driverModel.findByLicenseNo(String(licenseNo).trim());
    if (existingLicense) throw new AppError(409, "This license number is already in use");
  }

  const vt = await vehicleTypeModel.findById(vehicleTypeId);
  if (!vt) throw new AppError(404, "Vehicle type not found");

  const passwordHash = await hashPassword("123456");
  const user = await userModel.create({
    name,
    email,
    passwordHash,
    role: "driver",
  });

  const created = await driverModel.createWithDetails({
    userId: user.id,
    vehicleTypeId,
    phone,
    plate,
    vehicle,
    licenseNo,
    status: "active",
  });

  await paymentModel.create({
    driverId: created.id,
    amount: 2000,
    status: "pending",
    expireAt: null,
  });

  const row = await driverModel.findDetailedById(created.id);
  if (!row) throw new AppError(500, "Driver creation failed");
  return mapDriverRow(row);
}

module.exports = {
  listDrivers,
  updateLocationForUser,
  toggleOnlineForUser,
  getDriverById,
  updateDriverById,
  createDriverByAdmin,
  mapDriverRow,
};
