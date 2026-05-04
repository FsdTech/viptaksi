const { Router } = require("express");
const driverApplicationController = require("../controllers/driverApplication.controller");

const router = Router();

router.post("/", driverApplicationController.submit);

module.exports = router;
