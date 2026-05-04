const { query } = require("../config/database");
const { asyncHandler } = require("../middlewares/asyncHandler");

const summary = asyncHandler(async (_req, res) => {
  const [driversRes, passengersRes, paymentsRes, tripsRes] = await Promise.all([
    query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_online = TRUE)::int AS online FROM drivers"),
    query("SELECT COUNT(*)::int AS total FROM users WHERE role = 'rider'"),
    query("SELECT COALESCE(SUM(amount), 0)::numeric AS total FROM payments WHERE status = 'approved'"),
    query("SELECT COUNT(*)::int AS total FROM trips"),
  ]);

  res.json({
    totalDrivers: driversRes.rows[0]?.total ?? 0,
    onlineDrivers: driversRes.rows[0]?.online ?? 0,
    totalPassengers: passengersRes.rows[0]?.total ?? 0,
    totalRevenue: Number(paymentsRes.rows[0]?.total ?? 0),
    totalTrips: tripsRes.rows[0]?.total ?? 0,
  });
});

const revenueSeries = asyncHandler(async (_req, res) => {
  const result = await query(
    `
      SELECT
        to_char(date_trunc('hour', approved_at), 'HH24:00') AS label,
        COALESCE(SUM(amount), 0)::numeric AS amount
      FROM payments
      WHERE status = 'approved'
        AND approved_at >= NOW() - INTERVAL '24 hours'
      GROUP BY date_trunc('hour', approved_at)
      ORDER BY date_trunc('hour', approved_at) ASC
    `
  );
  res.json({
    points: result.rows.map((r) => ({
      label: r.label,
      amount: Number(r.amount ?? 0),
    })),
  });
});

const recentDrivers = asyncHandler(async (_req, res) => {
  const result = await query(
    `
      SELECT
        d.id,
        COALESCE(u.name, '-') AS name,
        COALESCE(d.phone, '-') AS phone,
        COALESCE(d.plate, '-') AS plate,
        COALESCE(d.status, 'active') AS status,
        COALESCE(d.is_online, false) AS is_online,
        u.created_at
      FROM drivers d
      LEFT JOIN users u ON u.id = d.user_id
      ORDER BY COALESCE(u.created_at, NOW()) DESC, d.id DESC
      LIMIT 5
    `
  );

  res.json({
    drivers: result.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name ?? "-"),
      phone: String(r.phone ?? "-"),
      plate: String(r.plate ?? "-"),
      status: String(r.status ?? "active"),
      isOnline: Boolean(r.is_online),
      createdAt: r.created_at,
    })),
  });
});

module.exports = { summary, revenueSeries, recentDrivers };
