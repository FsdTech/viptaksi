const { pool } = require("../db");
/* ADDED */
const bcrypt = require("bcryptjs");

const ALLOWED_ADMIN_ROLES = new Set(["super_admin", "yonetici"]);

function normalizeAdminRole(role) {
  const r = String(role ?? "").trim();
  return ALLOWED_ADMIN_ROLES.has(r) ? r : "yonetici";
}

async function getAdminRoles(req, res) {
  try {
    const result = await pool.query(
      "SELECT code, display_name, sort_order FROM admin_roles ORDER BY sort_order ASC, code ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /admins/roles error:", error);
    res.status(500).json({ message: "Rol listesi alinamadi." });
  }
}

/* EKLENDİ */
async function getAdmins(req, res) {
  try {
    const result = await pool.query(
      `
        SELECT a.id, a.name, a.email, a.role, r.display_name AS role_display, a.status
        FROM admins a
        LEFT JOIN admin_roles r ON r.code = a.role
        ORDER BY a.id ASC
      `
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /admins error:", error);
    res.status(500).json({ message: "Admin listesi alinamadi." });
  }
}

/* EKLENDİ */
async function createAdmin(req, res) {
  try {
    const { name, email, status, password } = req.body;
    const role = normalizeAdminRole(req.body?.role);
    /* ADDED */
    const passwordHash = await bcrypt.hash(password || "123456", 10);

    const result = await pool.query(
      `
        INSERT INTO admins (name, email, role, status, password_hash, password)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, role, status
      `,
      [name, email, role, status ?? "Aktif", passwordHash, passwordHash]
    );
    const row = result.rows[0];
    const label = await pool.query("SELECT display_name FROM admin_roles WHERE code = $1", [row.role]);
    res.status(201).json({
      ...row,
      role_display: label.rows[0]?.display_name ?? row.role,
    });
  } catch (error) {
    console.error("POST /admins error:", error);
    res.status(500).json({ message: "Admin eklenemedi." });
  }
}

/* ADDED */
async function updateAdmin(req, res) {
  try {
    const { id } = req.params;
    const targetId = Number(id);
    const requester = req.user;
    const isSuper = requester?.role === "super_admin";

    if (!isSuper) {
      if (!requester?.isPanelAdmin || Number(requester.id) !== targetId) {
        return res.status(403).json({ message: "Sadece kendi sifrenizi degistirebilirsiniz." });
      }
      const pwd = req.body?.password;
      if (pwd == null || String(pwd).trim() === "") {
        return res.status(400).json({ message: "Yeni sifre gerekli." });
      }
      const hashedPassword = await bcrypt.hash(String(pwd), 10);
      const result = await pool.query(
        `
          UPDATE admins
          SET password_hash = $1, password = $1
          WHERE id = $2
          RETURNING id, name, email, role, status
        `,
        [hashedPassword, targetId]
      );
      const row = result.rows[0];
      if (!row) return res.status(404).json({ message: "Admin bulunamadi." });
      const label = await pool.query("SELECT display_name FROM admin_roles WHERE code = $1", [row.role]);
      return res.json({
        ...row,
        role_display: label.rows[0]?.display_name ?? row.role,
      });
    }

    const { name, email, password, status } = req.body;
    const role = normalizeAdminRole(req.body?.role);

    const prevRow = await pool.query("SELECT role FROM admins WHERE id = $1", [targetId]);
    if (prevRow.rows[0]?.role === "super_admin" && role === "yonetici") {
      const cnt = await pool.query("SELECT COUNT(*)::int AS c FROM admins WHERE role = 'super_admin'");
      if (cnt.rows[0].c <= 1) {
        return res.status(403).json({ message: "Son super admin yoneticiye indirilemez." });
      }
    }

    let result;
    if (password && String(password).trim() !== "") {
      const hashedPassword = await bcrypt.hash(String(password), 10);
      result = await pool.query(
        `
          UPDATE admins
          SET
            name = $1,
            email = $2,
            role = $3,
            status = COALESCE($4, status),
            password_hash = $5,
            password = $5
          WHERE id = $6
          RETURNING id, name, email, role, status
        `,
        [name, email, role, status ?? null, hashedPassword, targetId]
      );
    } else {
      result = await pool.query(
        `
          UPDATE admins
          SET
            name = $1,
            email = $2,
            role = $3,
            status = COALESCE($4, status)
          WHERE id = $5
          RETURNING id, name, email, role, status
        `,
        [name, email, role, status ?? null, targetId]
      );
    }

    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Admin bulunamadi." });
    const label = await pool.query("SELECT display_name FROM admin_roles WHERE code = $1", [row.role]);
    res.json({
      ...row,
      role_display: label.rows[0]?.display_name ?? row.role,
    });
  } catch (error) {
    console.error("PUT /admins/:id error:", error);
    res.status(500).json({ message: "Admin guncellenemedi." });
  }
}

/* ADDED */
async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    const check = await pool.query("SELECT role FROM admins WHERE id = $1", [id]);
    const row = check.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Admin bulunamadi." });
    }
    if (row.role === "super_admin") {
      const cnt = await pool.query("SELECT COUNT(*)::int AS c FROM admins WHERE role = 'super_admin'");
      if (cnt.rows[0].c <= 1) {
        return res.status(403).json({ message: "Son super admin silinemez." });
      }
    }
    await pool.query("DELETE FROM admins WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /admins/:id error:", error);
    res.status(500).json({ message: "Admin silinemedi." });
  }
}

/* ADDED */
async function getActiveAdmins(req, res) {
  try {
    const result = await pool.query(`
      SELECT DISTINCT a.id, a.name, a.email
      FROM admin_sessions s
      JOIN admins a ON a.id = s.admin_id
      WHERE s.is_active = true
      AND s.last_seen > NOW() - INTERVAL '5 minutes'
      ORDER BY a.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /admin/active error:", error);
    res.status(500).json({ message: "Aktif adminler alinamadi." });
  }
}

module.exports = {
  getAdminRoles,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getActiveAdmins,
};
