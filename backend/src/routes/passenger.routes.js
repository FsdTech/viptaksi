const { Router } = require("express");
const { authenticate } = require("../middlewares/authenticate");
const { authorizePanel } = require("../middlewares/authorizePanel");
const passengerController = require("../controllers/passenger.controller");

const router = Router();

router.get("/", authenticate, authorizePanel, passengerController.list);

module.exports = router;
