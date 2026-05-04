require("../config/env");
const { getPool } = require("../config/database");
const { hashPassword } = require("../utils/password.util");

function getDemoDataByLocale(locale) {
  const tr = {
    drivers: [
      {
        name: "Ahmet Yilmaz",
        email: "driver.ahmet@demo.local",
        phone: "+90 532 100 0001",
        vt: "normal",
        lat: 36.8969,
        lng: 30.7133,
        online: true,
        rating: 4.8,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: 6,
          receiptText: "Receipt Ahmet",
        },
      },
      {
        name: "Mehmet Kaya",
        email: "driver.mehmet@demo.local",
        phone: "+90 532 100 0002",
        vt: "premium",
        lat: 36.8892,
        lng: 30.7041,
        online: true,
        rating: 4.9,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: 20,
          receiptText: "Receipt Mehmet",
        },
      },
      {
        name: "Ali Veli",
        email: "driver.ali@demo.local",
        phone: "+90 532 100 0003",
        vt: "vip",
        lat: 36.9322,
        lng: 30.6961,
        online: false,
        rating: 4.6,
        payment: {
          amount: 2000,
          planType: "weekly",
          status: "pending",
          expireInDays: null,
          receiptText: "Receipt Ali",
        },
      },
      {
        name: "Murat Sahin",
        email: "driver.murat@demo.local",
        phone: "+90 532 100 0004",
        vt: "motor",
        lat: 36.8749,
        lng: 30.7758,
        online: false,
        rating: 4.2,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: -2,
          receiptText: "Receipt Murat",
        },
      },
    ],
    riders: [
      { name: "Ayse Demir", email: "rider.ayse@demo.local", phone: "+90 555 100 0001" },
      { name: "Fatma Kaya", email: "rider.fatma@demo.local", phone: "+90 555 100 0002" },
      { name: "Selin Aydin", email: "rider.selin@demo.local", phone: "+90 555 100 0003" },
      { name: "Zeynep Koc", email: "rider.zeynep@demo.local", phone: "+90 555 100 0004" },
    ],
  };

  const en = {
    drivers: [
      {
        name: "David Wilson",
        email: "driver.david@demo.local",
        phone: "+1 202 555 0101",
        vt: "normal",
        lat: 36.8969,
        lng: 30.7133,
        online: true,
        rating: 4.8,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: 6,
          receiptText: "Receipt David",
        },
      },
      {
        name: "Daniel Miller",
        email: "driver.daniel@demo.local",
        phone: "+1 202 555 0102",
        vt: "premium",
        lat: 36.8892,
        lng: 30.7041,
        online: true,
        rating: 4.9,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: 20,
          receiptText: "Receipt Daniel",
        },
      },
      {
        name: "Sophia Davis",
        email: "driver.sophia@demo.local",
        phone: "+1 202 555 0103",
        vt: "vip",
        lat: 36.9322,
        lng: 30.6961,
        online: false,
        rating: 4.6,
        payment: {
          amount: 2000,
          planType: "weekly",
          status: "pending",
          expireInDays: null,
          receiptText: "Receipt Sophia",
        },
      },
      {
        name: "Oliver Carter",
        email: "driver.oliver@demo.local",
        phone: "+1 202 555 0104",
        vt: "motor",
        lat: 36.8749,
        lng: 30.7758,
        online: false,
        rating: 4.2,
        payment: {
          amount: 6000,
          planType: "monthly",
          status: "approved",
          expireInDays: -2,
          receiptText: "Receipt Oliver",
        },
      },
    ],
    riders: [
      { name: "John Smith", email: "rider.john@demo.local", phone: "+1 303 555 0101" },
      { name: "Emma Johnson", email: "rider.emma@demo.local", phone: "+1 303 555 0102" },
      { name: "Michael Brown", email: "rider.michael@demo.local", phone: "+1 303 555 0103" },
      { name: "Olivia Taylor", email: "rider.olivia@demo.local", phone: "+1 303 555 0104" },
    ],
  };

  return locale === "tr" ? tr : en;
}

async function main() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query("SELECT to_regclass('public.users') AS users_tbl, to_regclass('public.drivers') AS drivers_tbl, to_regclass('public.trips') AS trips_tbl, to_regclass('public.payments') AS payments_tbl, to_regclass('public.vehicle_types') AS vehicle_types_tbl");
    const row = check.rows[0] || {};
    if (!row.users_tbl || !row.drivers_tbl || !row.trips_tbl || !row.payments_tbl || !row.vehicle_types_tbl) {
      throw new Error("Core tables missing. Run `npm run db:schema` first.");
    }

    const passwordHash = await hashPassword("123456");
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const locale = String(process.env.DEMO_SEED_LOCALE || "en")
      .trim()
      .toLowerCase();
    const { drivers: demoDrivers, riders: demoRiders } = getDemoDataByLocale(locale);

    // Ensure only one locale dataset exists at a time.
    // Remove previous demo users so TR/EN names do not mix.
    await client.query(
      `
        DELETE FROM users
        WHERE email LIKE 'driver.%@demo.local'
           OR email LIKE 'rider.%@demo.local'
      `
    );

    const vehicleTypes = await client.query("SELECT id, LOWER(name) AS key FROM vehicle_types");
    const typeIdByKey = {};
    for (const vt of vehicleTypes.rows) typeIdByKey[vt.key] = vt.id;

    const driverIds = [];
    for (const d of demoDrivers) {
      const expireAt =
        typeof d.payment.expireInDays === "number"
          ? new Date(now.getTime() + d.payment.expireInDays * dayMs)
          : null;
      const receiptUrl = `https://dummyimage.com/900x1200/111111/f5b700&text=${encodeURIComponent(
        d.payment.receiptText
      )}`;

      const userRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'driver'::user_role)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone
         RETURNING id`,
        [d.name, d.email, d.phone, passwordHash]
      );
      const userId = userRes.rows[0].id;
      const vtId = typeIdByKey[d.vt];
      if (!vtId) continue;

      const driverRes = await client.query(
        `INSERT INTO drivers (user_id, vehicle_type_id, is_online, lat, lng, rating)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE
           SET vehicle_type_id = EXCLUDED.vehicle_type_id,
               is_online = EXCLUDED.is_online,
               lat = EXCLUDED.lat,
               lng = EXCLUDED.lng,
               rating = EXCLUDED.rating
         RETURNING id`,
        [userId, vtId, d.online, d.lat, d.lng, d.rating]
      );
      const driverId = driverRes.rows[0].id;
      driverIds.push(driverId);

      await client.query("DELETE FROM payments WHERE driver_id = $1", [driverId]);
      await client.query(
        `INSERT INTO payments (driver_id, amount, status, expire_at, plan_type, receipt_url)
         VALUES ($1, $2, $3::payment_status, $4, $5, $6)`,
        [
          driverId,
          d.payment.amount,
          d.payment.status,
          expireAt,
          d.payment.planType ?? "monthly",
          receiptUrl,
        ]
      );
    }

    const riderIds = [];
    for (const r of demoRiders) {
      const userRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, 'rider'::user_role)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone
         RETURNING id`,
        [r.name, r.email, r.phone, passwordHash]
      );
      riderIds.push(userRes.rows[0].id);
    }

    const normalTypeId = typeIdByKey.normal || Object.values(typeIdByKey)[0];
    if (normalTypeId && driverIds.length > 0 && riderIds.length > 0) {
      await client.query("DELETE FROM trips WHERE rider_id = ANY($1::uuid[])", [riderIds]);
      const tripRows = [
        { rider: riderIds[0], driver: driverIds[0], status: "completed", sLat: 36.8969, sLng: 30.7133, eLat: 36.8894, eLng: 30.6991, dist: 8.2, dur: 22, price: 120 },
        { rider: riderIds[1], driver: driverIds[1], status: "completed", sLat: 36.9322, sLng: 30.6961, eLat: 36.8612, eLng: 30.7822, dist: 10.7, dur: 29, price: 180 },
        { rider: riderIds[2], driver: null, status: "pending", sLat: 36.9001, sLng: 30.7002, eLat: 36.9201, eLng: 30.7401, dist: 6.1, dur: 17, price: 95 },
      ];
      for (const t of tripRows) {
        await client.query(
          `INSERT INTO trips (
            driver_id, rider_id, vehicle_type_id, status,
            start_lat, start_lng, end_lat, end_lng,
            estimated_distance_km, estimated_duration_min, actual_duration_min, price, completed_at
          )
          VALUES (
            $1, $2, $3, $4::trip_status,
            $5, $6, $7, $8, $9, $10, $11, $12,
            CASE WHEN $4 = 'completed' THEN NOW() ELSE NULL END
          )`,
          [t.driver, t.rider, normalTypeId, t.status, t.sLat, t.sLng, t.eLat, t.eLng, t.dist, t.dur, t.status === "completed" ? t.dur : null, t.price]
        );
      }
    }

    await client.query("COMMIT");
    console.log(`Demo data seeded successfully. Locale: ${locale === "tr" ? "TR" : "EN"}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Demo seed failed:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
