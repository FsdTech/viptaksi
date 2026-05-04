const { pool, isDatabaseAvailable } = require("../db");
const { Country, City } = require("country-state-city");

const PAYMENT_GATEWAY_ORDER = [
  "iban",
  "midtrans",
  "xendit",
  "paypal",
  "paystack",
  "razorpay",
  "stripe",
  "mercado_pago",
];

const PAYMENT_GATEWAY_SET = new Set(PAYMENT_GATEWAY_ORDER);
const FEATURED_COUNTRY_CODES = [
  "TR",
  "US",
  "GB",
  "DE",
  "FR",
  "IT",
  "ES",
  "SA",
  "AE",
  "IN",
  "PK",
  "ID",
  "JP",
  "CA",
  "AU",
  "BR",
  "MX",
  "ZA",
];
const TURKEY_81_CITIES = [
  "Adana",
  "Adiyaman",
  "Afyonkarahisar",
  "Agri",
  "Amasya",
  "Ankara",
  "Antalya",
  "Artvin",
  "Aydin",
  "Balikesir",
  "Bilecik",
  "Bingol",
  "Bitlis",
  "Bolu",
  "Burdur",
  "Bursa",
  "Canakkale",
  "Cankiri",
  "Corum",
  "Denizli",
  "Diyarbakir",
  "Edirne",
  "Elazig",
  "Erzincan",
  "Erzurum",
  "Eskisehir",
  "Gaziantep",
  "Giresun",
  "Gumushane",
  "Hakkari",
  "Hatay",
  "Isparta",
  "Mersin",
  "Istanbul",
  "Izmir",
  "Kars",
  "Kastamonu",
  "Kayseri",
  "Kirklareli",
  "Kirsehir",
  "Kocaeli",
  "Konya",
  "Kutahya",
  "Malatya",
  "Manisa",
  "Kahramanmaras",
  "Mardin",
  "Mugla",
  "Mus",
  "Nevsehir",
  "Nigde",
  "Ordu",
  "Rize",
  "Sakarya",
  "Samsun",
  "Siirt",
  "Sinop",
  "Sivas",
  "Tekirdag",
  "Tokat",
  "Trabzon",
  "Tunceli",
  "Sanliurfa",
  "Usak",
  "Van",
  "Yozgat",
  "Zonguldak",
  "Aksaray",
  "Bayburt",
  "Karaman",
  "Kirikkale",
  "Batman",
  "Sirnak",
  "Bartin",
  "Ardahan",
  "Igdir",
  "Yalova",
  "Karabuk",
  "Kilis",
  "Osmaniye",
  "Duzce",
];

const DEFAULT_GATEWAY_DISPLAY_NAME = {
  iban: "IBAN",
  midtrans: "Midtrans",
  xendit: "Xendit",
  paypal: "Paypal",
  paystack: "PayStack",
  razorpay: "Razorpay",
  stripe: "Stripe",
  mercado_pago: "Mercado Pago",
};

function normalizeGatewayConfig(code, raw) {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const t = (k) => String(o[k] ?? "").trim();
  switch (code) {
    case "midtrans":
      return { merchantId: t("merchantId"), clientKey: t("clientKey"), secretKey: t("secretKey") };
    case "xendit":
      return { secretKey: t("secretKey") };
    case "paypal":
      return { clientId: t("clientId"), secretId: t("secretId") };
    case "paystack":
      return { key: t("key"), callbackUrl: t("callbackUrl") };
    case "razorpay":
      return { clientKey: t("clientKey"), secretId: t("secretId") };
    case "stripe":
      return { publishableKey: t("publishableKey"), secretKey: t("secretKey") };
    case "mercado_pago":
      return { accessToken: t("accessToken"), callbackUrl: t("callbackUrl") };
    case "iban":
    default:
      return {};
  }
}

function rowToGateway(row) {
  const code = row.code;
  return {
    code,
    displayName: row.display_name,
    enabled: Boolean(row.enabled),
    config: normalizeGatewayConfig(code, row.config),
  };
}

function norm(v) {
  return String(v || "").trim().toLowerCase();
}

function slugify(value) {
  return norm(value)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTurkeyCities() {
  return TURKEY_81_CITIES.map((name) => ({
    name,
    slug: slugify(name),
  }));
}

function dedupeAndSortCities(cities) {
  const seen = new Set();
  const out = [];
  for (const city of cities) {
    const key = norm(city.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(city);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

function getCountryCities(countryCode) {
  if (countryCode === "TR") return getTurkeyCities();
  const fromLib = City.getCitiesOfCountry(countryCode) || [];
  return dedupeAndSortCities(
    fromLib.map((city) => ({ name: city.name, slug: slugify(city.name) }))
  );
}

async function searchGeoCountries(req, res) {
  try {
    const q = norm(req.query.q);
    const all = Country.getAllCountries()
      .map((country) => ({ countryCode: country.isoCode, country: country.name }))
      .sort((a, b) => a.country.localeCompare(b.country));
    let list;
    if (!q) {
      list = FEATURED_COUNTRY_CODES.map((code) => all.find((c) => c.countryCode === code)).filter(Boolean);
    } else {
      list = all.filter((c) => norm(c.country).startsWith(q));
    }
    res.json({ countries: list });
  } catch (error) {
    console.error("GET /settings/geo/countries error:", error);
    res.status(500).json({ message: "Country list could not be fetched." });
  }
}

async function searchGeoCities(req, res) {
  try {
    const countryCode = String(req.query.countryCode || "").trim().toUpperCase();
    if (!countryCode) {
      res.status(400).json({ message: "countryCode is required." });
      return;
    }
    const q = norm(req.query.q);
    const allCities = getCountryCities(countryCode);
    const cities = q ? allCities.filter((c) => norm(c.name).startsWith(q)) : allCities;
    res.json({ cities });
  } catch (error) {
    console.error("GET /settings/geo/cities error:", error);
    res.status(500).json({ message: "City list could not be fetched." });
  }
}

/* EKLENDİ */
async function getSettings(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, site_name, support_email, phone, currency, maintenance_mode FROM settings ORDER BY id ASC LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("GET /settings error:", error);
    res.status(500).json({ message: "Settings alinamadi." });
  }
}

/* EKLENDİ */
async function updateSettings(req, res) {
  try {
    const { site_name, support_email, phone, currency, maintenance_mode } = req.body;

    const result = await pool.query(
      `
        UPDATE settings
        SET
          site_name = $1,
          support_email = $2,
          phone = $3,
          currency = $4,
          maintenance_mode = $5
        WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
        RETURNING id, site_name, support_email, phone, currency, maintenance_mode
      `,
      [site_name, support_email, phone, currency, Boolean(maintenance_mode)]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("PUT /settings error:", error);
    res.status(500).json({ message: "Settings guncellenemedi." });
  }
}

async function getPricingSettings(req, res) {
  try {
    const result = await pool.query(
      `
        SELECT
          short_distance_min_fare,
          free_wait_minutes,
          wait_fee_per_min
        FROM settings
        ORDER BY id ASC
        LIMIT 1
      `
    );
    const row = result.rows[0] || {};
    res.json({
      short_distance_min_fare: Number(row.short_distance_min_fare ?? 200),
      free_wait_minutes: Number(row.free_wait_minutes ?? 10),
      wait_fee_per_min: Number(row.wait_fee_per_min ?? 5),
    });
  } catch (error) {
    console.error("GET /settings/pricing error:", error);
    res.status(500).json({ message: "Pricing settings alinamadi." });
  }
}

async function savePricingSettings(req, res) {
  try {
    const {
      short_distance_min_fare: shortDistanceMinFare,
      free_wait_minutes: freeWaitMinutes,
      wait_fee_per_min: waitFeePerMin,
    } = req.body || {};
    const result = await pool.query(
      `
        UPDATE settings
        SET
          short_distance_min_fare = $1,
          free_wait_minutes = $2,
          wait_fee_per_min = $3
        WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
        RETURNING short_distance_min_fare, free_wait_minutes, wait_fee_per_min
      `,
      [
        Number(shortDistanceMinFare) || 200,
        Number(freeWaitMinutes) || 10,
        Number(waitFeePerMin) || 5,
      ]
    );
    const row = result.rows[0] || {};
    res.json({
      short_distance_min_fare: Number(row.short_distance_min_fare ?? 200),
      free_wait_minutes: Number(row.free_wait_minutes ?? 10),
      wait_fee_per_min: Number(row.wait_fee_per_min ?? 5),
    });
  } catch (error) {
    console.error("POST /settings/pricing error:", error);
    res.status(500).json({ message: "Pricing settings kaydedilemedi." });
  }
}

/* ADDED */
async function getMapSettings(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, map_provider, google_maps_api_key, default_lat, default_lng, country, city, default_zoom, created_at, updated_at FROM map_settings ORDER BY id ASC LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("GET /settings/map error:", error);
    res.status(500).json({ message: "Map settings alinamadi." });
  }
}

/* ADDED */
async function saveMapSettings(req, res) {
  try {
    const { google_maps_api_key, default_lat, default_lng, map_provider, country, city, default_zoom } = req.body;
    const provider =
      map_provider === "google_maps" || map_provider === "leaflet" ? map_provider : "leaflet";
    const zoomRaw = Number(default_zoom);
    const zoom = Number.isFinite(zoomRaw) ? Math.max(3, Math.min(20, Math.round(zoomRaw))) : 13;
    const result = await pool.query(
      `
        UPDATE map_settings
        SET
          map_provider = $1,
          google_maps_api_key = $2,
          default_lat = $3,
          default_lng = $4,
          country = $5,
          city = $6,
          default_zoom = $7,
          updated_at = NOW()
        WHERE id = (SELECT id FROM map_settings ORDER BY id ASC LIMIT 1)
        RETURNING id, map_provider, google_maps_api_key, default_lat, default_lng, country, city, default_zoom, created_at, updated_at
      `,
      [
        provider,
        google_maps_api_key || "",
        Number(default_lat) || 0,
        Number(default_lng) || 0,
        String(country || "").trim(),
        String(city || "").trim(),
        zoom,
      ]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("POST /settings/map error:", error);
    res.status(500).json({ message: "Map settings kaydedilemedi." });
  }
}

/* ADDED */
async function getSmtpSettings(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, host, port, user_name, password, created_at, updated_at FROM smtp_settings ORDER BY id ASC LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("GET /settings/smtp error:", error);
    res.status(500).json({ message: "SMTP settings alinamadi." });
  }
}

/* ADDED */
async function saveSmtpSettings(req, res) {
  try {
    const { host, port, user, password } = req.body;
    const result = await pool.query(
      `
        UPDATE smtp_settings
        SET host = $1, port = $2, user_name = $3, password = $4, updated_at = NOW()
        WHERE id = (SELECT id FROM smtp_settings ORDER BY id ASC LIMIT 1)
        RETURNING id, host, port, user_name, password, created_at, updated_at
      `,
      [host || "", Number(port) || 0, user || "", password || ""]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error("POST /settings/smtp error:", error);
    res.status(500).json({ message: "SMTP settings kaydedilemedi." });
  }
}

/* ADDED */
async function getPaymentSettings(req, res) {
  try {
    const result = await pool.query(
      `SELECT code, display_name, enabled, COALESCE(config, '{}'::jsonb) AS config
       FROM payment_gateways
       WHERE code = ANY($1::text[])
       ORDER BY array_position($1::text[], code)`,
      [PAYMENT_GATEWAY_ORDER]
    );
    const byCode = new Map(result.rows.map((r) => [r.code, r]));
    const gateways = PAYMENT_GATEWAY_ORDER.map((code) => {
      const row = byCode.get(code);
      if (!row) {
        return {
          code,
          displayName: DEFAULT_GATEWAY_DISPLAY_NAME[code] || code,
          enabled: false,
          config: normalizeGatewayConfig(code, {}),
        };
      }
      return rowToGateway(row);
    });
    res.json({ gateways });
  } catch (error) {
    console.error("GET /settings/payment error:", error);
    res.status(500).json({ message: "Payment settings alinamadi." });
  }
}

/* ADDED */
async function savePaymentSettings(req, res) {
  try {
    const body = req.body || {};
    const incoming = Array.isArray(body.gateways) ? body.gateways : null;
    if (!incoming) {
      res.status(400).json({ message: "gateways dizisi gerekli." });
      return;
    }

    await pool.query("BEGIN");
    try {
      for (const g of incoming) {
        const code = String(g.code || "").trim();
        if (!PAYMENT_GATEWAY_SET.has(code)) continue;
        const rawName = String(g.displayName ?? g.display_name ?? "").trim();
        const displayName =
          rawName || DEFAULT_GATEWAY_DISPLAY_NAME[code] || code;
        const enabled = Boolean(g.enabled);
        const config = normalizeGatewayConfig(code, g.config);
        await pool.query(
          `
            INSERT INTO payment_gateways (code, display_name, enabled, config, updated_at)
            VALUES ($1, $2, $3, $4::jsonb, NOW())
            ON CONFLICT (code) DO UPDATE SET
              display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), payment_gateways.display_name),
              enabled = EXCLUDED.enabled,
              config = EXCLUDED.config,
              updated_at = NOW()
          `,
          [code, displayName, enabled, JSON.stringify(config)]
        );
        const cfgJson = JSON.stringify(config);
        await pool.query(
          `
            INSERT INTO payment_methods (code, name, display_name, enabled, config, api_config, updated_at)
            VALUES ($1, $2, $3, $4, $5::jsonb, '{}'::jsonb, NOW())
            ON CONFLICT (code) DO UPDATE SET
              name = EXCLUDED.name,
              display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), payment_methods.display_name),
              enabled = EXCLUDED.enabled,
              config = EXCLUDED.config,
              api_config = EXCLUDED.api_config,
              updated_at = NOW()
          `,
          [code, displayName, displayName, enabled, cfgJson]
        );
      }
      await pool.query("COMMIT");
    } catch (inner) {
      await pool.query("ROLLBACK");
      throw inner;
    }

    const result = await pool.query(
      `SELECT code, display_name, enabled, COALESCE(config, '{}'::jsonb) AS config
       FROM payment_gateways
       WHERE code = ANY($1::text[])
       ORDER BY array_position($1::text[], code)`,
      [PAYMENT_GATEWAY_ORDER]
    );
    const byCode = new Map(result.rows.map((r) => [r.code, r]));
    const gateways = PAYMENT_GATEWAY_ORDER.map((code) => {
      const row = byCode.get(code);
      if (!row) {
        return {
          code,
          displayName: DEFAULT_GATEWAY_DISPLAY_NAME[code] || code,
          enabled: false,
          config: normalizeGatewayConfig(code, {}),
        };
      }
      return rowToGateway(row);
    });
    res.json({ gateways });
  } catch (error) {
    console.error("POST /settings/payment error:", error);
    res.status(500).json({ message: "Payment settings kaydedilemedi." });
  }
}

const SUPPORTED_LANGS_FIXED = ["tr", "en"];

function normalizeSupportedLanguages(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const normalized = arr
    .map((v) => String(v || "").trim().toLowerCase())
    .filter((v) => v === "tr" || v === "en");
  return normalized.length > 0 ? Array.from(new Set(normalized)) : SUPPORTED_LANGS_FIXED;
}

function normalizeDefaultLanguage(raw) {
  const v = String(raw ?? "tr").toLowerCase();
  return v === "en" ? "en" : "tr";
}

/* ADDED */
async function getLanguageSettings(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, default_language, supported_languages, created_at, updated_at FROM language_settings ORDER BY id ASC LIMIT 1"
    );
    const row = result.rows[0];
    if (!row) {
      res.json({
        default_language: "tr",
        supported_languages: SUPPORTED_LANGS_FIXED,
      });
      return;
    }
    res.json({
      id: row.id,
      default_language: normalizeDefaultLanguage(row.default_language),
      supported_languages: normalizeSupportedLanguages(row.supported_languages),
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch (error) {
    console.error("GET /settings/language error:", error);
    res.status(500).json({ message: "Language settings alinamadi." });
  }
}

/* ADDED */
async function saveLanguageSettings(req, res) {
  try {
    const default_language = normalizeDefaultLanguage(req.body?.default_language);
    const supportedLanguages = normalizeSupportedLanguages(req.body?.supported_languages);
    const result = await pool.query(
      `
        UPDATE language_settings
        SET default_language = $1, supported_languages = $2::jsonb, updated_at = NOW()
        WHERE id = (SELECT id FROM language_settings ORDER BY id ASC LIMIT 1)
        RETURNING id, default_language, supported_languages, created_at, updated_at
      `,
      [default_language, JSON.stringify(supportedLanguages)]
    );
    const saved = result.rows[0];
    res.json({
      ...saved,
      default_language: normalizeDefaultLanguage(saved?.default_language),
      supported_languages: normalizeSupportedLanguages(saved?.supported_languages),
    });
  } catch (error) {
    console.error("POST /settings/language error:", error);
    res.status(500).json({ message: "Language settings kaydedilemedi." });
  }
}

/** Public (no auth): site dilini okur — varsayılan Türkçe. */
async function getPublicLanguage(req, res) {
  try {
    const result = await pool.query(
      "SELECT default_language, supported_languages FROM language_settings ORDER BY id ASC LIMIT 1"
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ message: "Language settings not found" });
      return;
    }
    const default_language = normalizeDefaultLanguage(row.default_language);
    res.json({
      default_language,
      supported_languages: normalizeSupportedLanguages(row.supported_languages),
    });
  } catch (error) {
    if (!isDatabaseAvailable()) {
      res.status(503).json({ message: "Database offline" });
      return;
    }
    console.error("GET /api/public/language error:", error);
    res.status(500).json({ message: "Public language could not be fetched" });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getMapSettings,
  saveMapSettings,
  getSmtpSettings,
  saveSmtpSettings,
  getPaymentSettings,
  savePaymentSettings,
  getPricingSettings,
  savePricingSettings,
  getLanguageSettings,
  saveLanguageSettings,
  getPublicLanguage,
  searchGeoCountries,
  searchGeoCities,
};
