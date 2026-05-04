const { query } = require("../config/database");
const { asyncHandler } = require("../middlewares/asyncHandler");

function toGsmLabel(value) {
  const v = String(value || "").trim();
  if (!v) return "GSM: -";
  return v.toUpperCase().startsWith("GSM:") ? v : `GSM: ${v}`;
}

function toMailLabel(value) {
  const v = String(value || "").trim();
  if (!v) return "Mail: -";
  return v.toLowerCase().startsWith("mail:") ? `Mail: ${v.slice(5).trim()}` : `Mail: ${v}`;
}

const list = asyncHandler(async (_req, res) => {
  const { rows } = await query(`
    SELECT
      u.id,
      u.name,
      COALESCE(u.email, '') AS email,
      COALESCE(u.phone, '') AS phone,
      COALESCE(COUNT(t.id), 0)::int AS total_rides,
      COALESCE(AVG(CASE WHEN d.rating IS NOT NULL THEN d.rating END), 5)::numeric(3,2) AS rating
    FROM users u
    LEFT JOIN trips t ON t.rider_id = u.id
    LEFT JOIN drivers d ON d.id = t.driver_id
    WHERE u.role = 'rider'
    GROUP BY u.id, u.name, u.email, u.phone
    ORDER BY u.created_at DESC
    LIMIT 500
  `);
  res.json({
    passengers: rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: toGsmLabel(r.phone),
      gsm: toGsmLabel(r.phone),
      email: toMailLabel(r.email),
      totalRides: Number(r.total_rides ?? 0),
      rating: Number(r.rating ?? 5),
    })),
  });
});

module.exports = { list };
