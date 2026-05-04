const { Router } = require("express");
const {
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
  searchGeoCountries,
  searchGeoCities,
} = require("../controllers/settings.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");

/* EKLENDİ */
const router = Router();

/* EKLENDİ */
router.get("/", authenticate, authorizePanel, getSettings);
router.put("/", authenticate, authorizePanel, requireSuperAdmin, updateSettings);
/* ADDED */
router.get("/map", authenticate, authorizePanel, getMapSettings);
/* ADDED */
router.post("/map", authenticate, authorizePanel, requireSuperAdmin, saveMapSettings);
/* ADDED */
router.get("/smtp", authenticate, authorizePanel, getSmtpSettings);
/* ADDED */
router.post("/smtp", authenticate, authorizePanel, requireSuperAdmin, saveSmtpSettings);
/* ADDED */
router.get("/payment", authenticate, authorizePanel, getPaymentSettings);
/* ADDED */
router.post("/payment", authenticate, authorizePanel, requireSuperAdmin, savePaymentSettings);
router.get("/pricing", authenticate, authorizePanel, getPricingSettings);
router.post("/pricing", authenticate, authorizePanel, requireSuperAdmin, savePricingSettings);
/* ADDED */
router.get("/language", authenticate, authorizePanel, getLanguageSettings);
/* ADDED */
router.post("/language", authenticate, authorizePanel, requireSuperAdmin, saveLanguageSettings);
router.get("/geo/countries", authenticate, authorizePanel, searchGeoCountries);
router.get("/geo/cities", authenticate, authorizePanel, searchGeoCities);

module.exports = router;
