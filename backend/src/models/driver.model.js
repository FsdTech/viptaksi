const { query } = require("../config/database");

async function create({ userId, vehicleTypeId }) {
  const { rows } = await query(
    `INSERT INTO drivers (user_id, vehicle_type_id)
     VALUES ($1, $2)
     RETURNING id, user_id, vehicle_type_id, is_online, lat, lng, rating, created_at, updated_at`,
    [userId, vehicleTypeId]
  );
  return rows[0];
}

async function createWithDetails({
  userId,
  vehicleTypeId,
  phone,
  plate,
  vehicle,
  licenseNo,
  status = "active",
}) {
  const { rows } = await query(
    `INSERT INTO drivers (user_id, vehicle_type_id, phone, plate, vehicle, license_no, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, user_id, vehicle_type_id, is_online, lat, lng, rating, phone, plate, vehicle, license_no, status, created_at, updated_at`,
    [userId, vehicleTypeId, phone ?? null, plate ?? null, vehicle ?? null, licenseNo ?? null, status]
  );
  return rows[0];
}

async function findByUserId(userId) {
  const { rows } = await query(`SELECT * FROM drivers WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM drivers WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByLicenseNo(licenseNo) {
  const { rows } = await query(
    `SELECT * FROM drivers WHERE LOWER(TRIM(COALESCE(license_no, ''))) = LOWER(TRIM($1)) LIMIT 1`,
    [licenseNo]
  );
  return rows[0] || null;
}

async function findByLicenseNoExceptId(licenseNo, driverId) {
  const { rows } = await query(
    `SELECT * FROM drivers
     WHERE LOWER(TRIM(COALESCE(license_no, ''))) = LOWER(TRIM($1))
       AND id <> $2
     LIMIT 1`,
    [licenseNo, driverId]
  );
  return rows[0] || null;
}

async function listWithUserAndVehicleType() {
  const { rows } = await query(`
    SELECT
      d.id,
      d.user_id,
      d.vehicle_type_id,
      d.is_online,
      d.lat,
      d.lng,
      d.rating,
      d.phone,
      d.plate,
      d.vehicle,
      d.license_no,
      d.status,
      d.created_at,
      d.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      vt.name AS vehicle_type_name,
      vt.base_fare,
      vt.per_km_rate,
      vt.per_min_rate,
      p.id AS payment_id,
      p.status AS payment_status,
      p.amount AS payment_amount,
      p.plan_type AS payment_plan_type,
      p.expire_at AS payment_expire_at
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
    LEFT JOIN LATERAL (
      SELECT px.*
      FROM payments px
      WHERE px.driver_id = d.id
      ORDER BY px.updated_at DESC, px.created_at DESC
      LIMIT 1
    ) p ON TRUE
    ORDER BY d.created_at ASC
  `);
  return rows;
}

async function findDetailedById(driverId) {
  const { rows } = await query(
    `
      SELECT
        d.id,
        d.user_id,
        d.vehicle_type_id,
        d.is_online,
        d.lat,
        d.lng,
        d.rating,
        d.phone,
        d.plate,
        d.vehicle,
        d.license_no,
        d.status,
        d.created_at,
        d.updated_at,
        u.name AS user_name,
        u.email AS user_email,
        vt.name AS vehicle_type_name,
        vt.base_fare,
        vt.per_km_rate,
        vt.per_min_rate
      FROM drivers d
      JOIN users u ON u.id = d.user_id
      JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
      WHERE d.id = $1
      LIMIT 1
    `,
    [driverId]
  );
  return rows[0] || null;
}

async function updateDetailsById(driverId, payload) {
  const {
    name,
    email,
    phone,
    plate,
    vehicle,
    license_no: licenseNo,
    vehicle_type_id: vehicleTypeId,
    rating,
    status,
    is_online: isOnline,
  } = payload;
  const existing = await findById(driverId);
  if (!existing) return null;
  await query(
    `
      UPDATE users
      SET
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        updated_at = NOW()
      WHERE id = $1
    `,
    [existing.user_id, name ?? null, email ?? null]
  );
  const statusValue = status ?? null;
  const forcedOnline =
    statusValue === "banned" || statusValue === "passive"
      ? false
      : typeof isOnline === "boolean"
      ? isOnline
      : null;
  const { rows } = await query(
    `
      UPDATE drivers
      SET
        phone = COALESCE($2, phone),
        plate = COALESCE($3, plate),
        vehicle = COALESCE($4, vehicle),
        license_no = COALESCE($5, license_no),
        vehicle_type_id = COALESCE($6, vehicle_type_id),
        rating = COALESCE($7, rating),
        status = COALESCE($8, status),
        is_online = COALESCE($9, is_online),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      driverId,
      phone ?? null,
      plate ?? null,
      vehicle ?? null,
      licenseNo ?? null,
      vehicleTypeId ?? null,
      rating ?? null,
      status ?? null,
      forcedOnline,
    ]
  );
  return rows[0] || null;
}

async function updateLocation(driverId, lat, lng) {
  const { rows } = await query(
    `UPDATE drivers SET lat = $2, lng = $3 WHERE id = $1
     RETURNING id, user_id, vehicle_type_id, is_online, lat, lng, rating, updated_at`,
    [driverId, lat, lng]
  );
  return rows[0] || null;
}

async function setOnline(driverId, isOnline) {
  const { rows } = await query(
    `UPDATE drivers SET is_online = $2 WHERE id = $1
     RETURNING id, user_id, vehicle_type_id, is_online, lat, lng, rating, updated_at`,
    [driverId, isOnline]
  );
  return rows[0] || null;
}

async function listOnlineSnapshot() {
  const { rows } = await query(`
    SELECT
      d.id,
      d.user_id,
      d.is_online,
      d.lat,
      d.lng,
      d.rating,
      u.name AS user_name,
      vt.name AS vehicle_type_name
    FROM drivers d
    JOIN users u ON u.id = d.user_id
    JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
    WHERE d.is_online = TRUE
  `);
  return rows;
}

module.exports = {
  create,
  createWithDetails,
  findByUserId,
  findById,
  findByLicenseNo,
  findByLicenseNoExceptId,
  findDetailedById,
  updateDetailsById,
  listWithUserAndVehicleType,
  updateLocation,
  setOnline,
  listOnlineSnapshot,
};
