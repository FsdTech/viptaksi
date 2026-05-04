const express = require("express");
const router = express.Router();

// TEMP DEMO DATA (until DB wired)
router.get("/", async (req, res) => {
  return res.json([
    { id: 1, name: "Demo User 1" },
    { id: 2, name: "Demo User 2" },
  ]);
});

module.exports = router;
