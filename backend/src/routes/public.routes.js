const { Router } = require("express");
const { getPublicLanguage } = require("../controllers/settings.controller");

const router = Router();
router.get("/language", getPublicLanguage);

module.exports = router;
