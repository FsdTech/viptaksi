const { query } = require("../config/database");

async function deactivateExpiredDrivers() {
  const rel = await query("SELECT to_regclass('public.payments') AS payments_table");
  if (!rel.rows[0]?.payments_table) {
    return 0;
  }
  const { rowCount } = await query(
    `
      WITH latest_payment AS (
        SELECT DISTINCT ON (p.driver_id)
          p.driver_id,
          p.status,
          p.expire_at
        FROM payments p
        ORDER BY p.driver_id, p.updated_at DESC, p.created_at DESC
      )
      UPDATE drivers d
      SET is_online = FALSE,
          updated_at = NOW()
      FROM latest_payment lp
      WHERE d.id = lp.driver_id
        AND lp.status = 'approved'
        AND lp.expire_at IS NOT NULL
        AND lp.expire_at <= NOW()
        AND d.is_online = TRUE
    `
  );
  return rowCount || 0;
}

module.exports = { deactivateExpiredDrivers };
