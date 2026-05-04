const { pool, isDatabaseAvailable } = require("../db");

function resolveLang(queryLang) {
  return String(queryLang || "tr").toLowerCase() === "en" ? "en" : "tr";
}

/* ADDED */
async function getLanding(req, res) {
  try {
    const lang = resolveLang(req.query.lang);
    const result = await pool.query(
      "SELECT id, content, content_en, updated_at FROM landing_page ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 1"
    );
    const row = result.rows[0];
    if (!row) {
      res.json({
        content: "",
        content_tr: "",
        content_en: "",
        lang,
        updated_at: null,
      });
      return;
    }
    let html = row.content || "";
    if (lang === "en") {
      const en = String(row.content_en ?? "").trim();
      html = en || html;
    }
    res.json({
      id: row.id,
      content: html,
      content_tr: row.content ?? "",
      content_en: row.content_en ?? "",
      lang,
      updated_at: row.updated_at,
    });
  } catch (error) {
    if (!isDatabaseAvailable()) {
      res.status(503).json({ message: "Database offline" });
      return;
    }
    console.error("GET /api/landing error:", error);
    res.status(500).json({ message: "Landing content could not be fetched" });
  }
}

/* ADDED */
async function saveLanding(req, res) {
  try {
    const content = typeof req.body?.content === "string" ? req.body.content : "";
    const content_en = typeof req.body?.content_en === "string" ? req.body.content_en : "";
    const result = await pool.query(
      `
        INSERT INTO landing_page (content, content_en, updated_at)
        VALUES ($1, $2, NOW())
        RETURNING id, content, content_en, updated_at
      `,
      [content, content_en]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/landing error:", error);
    res.status(500).json({ message: "Landing content kaydedilemedi." });
  }
}

module.exports = {
  getLanding,
  saveLanding,
};
