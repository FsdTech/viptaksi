const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM users
      WHERE is_demo = true
      ORDER BY id DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("USERS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
