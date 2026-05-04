const bcrypt = require("bcryptjs");
const { getPool } = require("./config/database");

// Use a single shared PG pool across the backend.
const pool = getPool();

let databaseAvailable = false;

function isDatabaseAvailable() {
  return databaseAvailable;
}

async function initDatabase() {
  databaseAvailable = false;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        site_name TEXT,
        support_email TEXT,
        phone TEXT,
        currency TEXT,
        maintenance_mode BOOLEAN DEFAULT false
      );
    `);
    await pool.query(`
      ALTER TABLE settings
      ADD COLUMN IF NOT EXISTS short_distance_min_fare NUMERIC(10,2) DEFAULT 200
    `);
    await pool.query(`
      ALTER TABLE settings
      ADD COLUMN IF NOT EXISTS free_wait_minutes INTEGER DEFAULT 10
    `);
    await pool.query(`
      ALTER TABLE settings
      ADD COLUMN IF NOT EXISTS wait_fee_per_min NUMERIC(10,2) DEFAULT 5
    `);
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS landing_page (
        id SERIAL PRIMARY KEY,
        content TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE landing_page
      ADD COLUMN IF NOT EXISTS content_en TEXT
    `);
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS map_settings (
        id SERIAL PRIMARY KEY,
        google_maps_api_key TEXT,
        default_lat DOUBLE PRECISION DEFAULT 0,
        default_lng DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE map_settings
      ADD COLUMN IF NOT EXISTS map_provider TEXT DEFAULT 'leaflet'
    `);
    await pool.query(`
      ALTER TABLE map_settings
      ADD COLUMN IF NOT EXISTS country TEXT DEFAULT ''
    `);
    await pool.query(`
      ALTER TABLE map_settings
      ADD COLUMN IF NOT EXISTS city TEXT DEFAULT ''
    `);
    await pool.query(`
      ALTER TABLE map_settings
      ADD COLUMN IF NOT EXISTS default_zoom INTEGER DEFAULT 13
    `);
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS smtp_settings (
        id SERIAL PRIMARY KEY,
        host TEXT,
        port INTEGER DEFAULT 587,
        user_name TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name TEXT,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      ALTER TABLE payment_methods
      ADD COLUMN IF NOT EXISTS api_config JSONB DEFAULT '{}'::jsonb
    `);
    await pool.query(`
      ALTER TABLE payment_methods
      ADD COLUMN IF NOT EXISTS code TEXT
    `);
    await pool.query(`
      ALTER TABLE payment_methods
      ADD COLUMN IF NOT EXISTS display_name TEXT
    `);
    await pool.query(`
      ALTER TABLE payment_methods
      ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        code TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        config JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const paymentGatewaySeed = [
      ["iban", "IBAN"],
      ["midtrans", "Midtrans"],
      ["xendit", "Xendit"],
      ["paypal", "Paypal"],
      ["paystack", "PayStack"],
      ["razorpay", "Razorpay"],
      ["stripe", "Stripe"],
      ["mercado_pago", "Mercado Pago"],
    ];
    for (const [code, displayName] of paymentGatewaySeed) {
      await pool.query(
        `
          INSERT INTO payment_gateways (code, display_name, enabled, config)
          VALUES ($1, $2, false, '{}'::jsonb)
          ON CONFLICT (code) DO NOTHING
        `,
        [code, displayName]
      );
    }
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payment_methods_code_uidx ON payment_methods (code)
    `);
    await pool.query(`DELETE FROM payment_methods WHERE code IS NULL`);
    await pool.query(`
      DELETE FROM payment_methods pm
      WHERE EXISTS (SELECT 1 FROM payment_gateways LIMIT 1)
        AND pm.code NOT IN (SELECT code FROM payment_gateways)
    `);
    await pool.query(`
      INSERT INTO payment_methods (code, name, display_name, enabled, config, api_config, created_at, updated_at)
      SELECT
        g.code,
        g.display_name,
        g.display_name,
        g.enabled,
        COALESCE(g.config, '{}'::jsonb),
        '{}'::jsonb,
        NOW(),
        NOW()
      FROM payment_gateways g
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        display_name = EXCLUDED.display_name,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config,
        api_config = '{}'::jsonb,
        updated_at = NOW()
    `);
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS language_settings (
        id SERIAL PRIMARY KEY,
        default_language TEXT DEFAULT 'tr',
        supported_languages JSONB DEFAULT '["tr","en"]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        role TEXT,
        status TEXT
      );
    `);
    await pool.query(`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS phone TEXT
    `);
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone TEXT
    `);
    await pool.query(`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS plate TEXT
    `);
    await pool.query(`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS vehicle TEXT
    `);
    await pool.query(`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS license_no TEXT
    `);
    await pool.query(`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
    `);
    try {
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_no_uidx
        ON drivers (LOWER(TRIM(license_no)))
        WHERE license_no IS NOT NULL AND TRIM(license_no) <> ''
      `);
    } catch (idxErr) {
      console.warn("drivers_license_no_uidx:", idxErr.message);
    }
    /* ADDED */
    await pool.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `);
    /* ADDED */
    await pool.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS password TEXT
    `);
    /* ADDED */
    await pool.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
    `);
    /* ADDED */
    await pool.query(`
      UPDATE admins
      SET password = password_hash
      WHERE (password IS NULL OR password = '') AND password_hash IS NOT NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_roles (
        code TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        sort_order SMALLINT NOT NULL DEFAULT 0
      );
    `);
    await pool.query(`
      INSERT INTO admin_roles (code, display_name, sort_order) VALUES
        ('super_admin', 'Süper Admin', 1),
        ('yonetici', 'Yönetici', 2)
      ON CONFLICT (code) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        sort_order = EXCLUDED.sort_order
    `);
    await pool.query(`
      UPDATE admins SET role = 'yonetici'
      WHERE role IN ('Yönetici', 'admin', 'Operator', 'operator')
         OR role IS NULL OR TRIM(COALESCE(role, '')) = ''
    `);
    await pool.query(`
      UPDATE admins SET role = 'super_admin'
      WHERE email = 'admin@vipstar.com' AND role <> 'super_admin'
    `);
    await pool.query(`
      UPDATE admins SET role = 'yonetici'
      WHERE role NOT IN ('super_admin', 'yonetici')
    `);
    try {
      await pool.query(`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_fkey`);
    } catch (_dropErr) {
      /* ignore */
    }
    try {
      await pool.query(`
        ALTER TABLE admins
        ADD CONSTRAINT admins_role_fkey FOREIGN KEY (role) REFERENCES admin_roles (code)
      `);
    } catch (fkErr) {
      console.warn("admins.role FK:", fkErr.message);
    }

    const settingsCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM settings");
    if (settingsCountResult.rows[0].count === 0) {
      await pool.query(
        `
          INSERT INTO settings (site_name, support_email, phone, currency, maintenance_mode)
          VALUES ($1, $2, $3, $4, $5)
        `,
        ["VipStar Taksi", "destek@vipstar.com", "+90 5XX XXX XX XX", "TRY", false]
      );
    }
    await pool.query(`
      UPDATE settings
      SET
        short_distance_min_fare = COALESCE(short_distance_min_fare, 200),
        free_wait_minutes = COALESCE(free_wait_minutes, 10),
        wait_fee_per_min = COALESCE(wait_fee_per_min, 5)
      WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
    `);
    /* ADDED */
    const mapSettingsCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM map_settings");
    if (mapSettingsCountResult.rows[0].count === 0) {
      await pool.query(
        `
          INSERT INTO map_settings (google_maps_api_key, default_lat, default_lng, country, city, default_zoom, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `,
        ["", 0, 0, "", "", 13]
      );
    }
    /* ADDED */
    const smtpSettingsCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM smtp_settings");
    if (smtpSettingsCountResult.rows[0].count === 0) {
      await pool.query(
        `
          INSERT INTO smtp_settings (host, port, user_name, password, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `,
        ["smtp.gmail.com", 587, "admin@vipstar.com", process.env.SMTP_DEFAULT_PASSWORD || ""]
      );
    }
    await pool.query(
      `
        UPDATE smtp_settings
        SET
          host = CASE WHEN COALESCE(TRIM(host), '') = '' THEN 'smtp.gmail.com' ELSE host END,
          port = CASE WHEN COALESCE(port, 0) = 0 THEN 587 ELSE port END,
          user_name = CASE WHEN COALESCE(TRIM(user_name), '') = '' THEN 'admin@vipstar.com' ELSE user_name END,
          password = CASE WHEN COALESCE(TRIM(password), '') = '' THEN COALESCE($1, '') ELSE password END,
          updated_at = NOW()
        WHERE id = (SELECT id FROM smtp_settings ORDER BY id ASC LIMIT 1)
      `,
      [process.env.SMTP_DEFAULT_PASSWORD || ""]
    );
    /* ADDED */
    const languageSettingsCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM language_settings");
    if (languageSettingsCountResult.rows[0].count === 0) {
      await pool.query(
        `
          INSERT INTO language_settings (default_language, supported_languages, created_at, updated_at)
          VALUES ($1, $2::jsonb, NOW(), NOW())
        `,
        ["tr", JSON.stringify(["tr", "en"])]
      );
    }
    /* ADDED */
    const adminsCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM admins");
    if (adminsCountResult.rows[0].count === 0) {
      const defaultAdminPasswordHash = await bcrypt.hash("123456", 10);
      await pool.query(
        `
          INSERT INTO admins (name, email, role, status, password_hash, password)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          "System Admin",
          "admin@vipstar.com",
          "super_admin",
          "Aktif",
          defaultAdminPasswordHash,
          defaultAdminPasswordHash,
        ]
      );
    }
    /* ADDED - Update existing admin to super_admin if role is just 'admin' */
    await pool.query(
      `
        UPDATE admins
        SET role = 'super_admin'
        WHERE email = 'admin@vipstar.com' AND role = 'admin'
      `
    );

    /* ADDED */
    const fallbackAdminPasswordHash = await bcrypt.hash("123456", 10);
    await pool.query(
      `
        UPDATE admins
        SET password_hash = $1, password = $1
        WHERE password_hash IS NULL OR password_hash = ''
      `,
      [fallbackAdminPasswordHash]
    );
    /* ADDED */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id SERIAL PRIMARY KEY,
        admin_id INT,
        is_active BOOLEAN DEFAULT true,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'monthly'
    `);
    await pool.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS receipt_url TEXT
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_applications (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        plate TEXT NOT NULL,
        vehicle TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'normal',
        license_image TEXT,
        receipt_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    databaseAvailable = true;
  } catch (error) {
    databaseAvailable = false;
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = {
  pool,
  initDatabase,
  isDatabaseAvailable,
};
