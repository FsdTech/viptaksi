const tripService = require("../services/trip.service");
const { asyncHandler } = require("../middlewares/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const { trip, quote } = await tripService.createTripForRider(req.user.id, req.body);
  res.status(201).json({ trip, quote });
});

const accept = asyncHandler(async (req, res) => {
  const trip = await tripService.acceptTrip(req.user.id, req.body.trip_id);
  res.json({ trip });
});

const complete = asyncHandler(async (req, res) => {
  const trip = await tripService.completeTrip(req.user.id, req.body);
  res.json({ trip });
});

const list = asyncHandler(async (req, res) => {
  const trips = await tripService.listTripsAdmin();
  res.json({ trips });
});

const mine = asyncHandler(async (req, res) => {
  const trips = await tripService.listMine(req.user);
  res.json({ trips });
});

const pending = asyncHandler(async (req, res) => {
  const trips = await tripService.listPendingForDriver(req.user.id);
  res.json({ trips });
});

const cancel = asyncHandler(async (req, res) => {
  const trip = await tripService.cancelTripByRider(req.user.id, req.body.trip_id);
  res.json({ trip });
});

const start = asyncHandler(async (req, res) => {
  const trip = await tripService.startTripByDriver(req.user.id, req.body.trip_id);
  res.json({ trip });
});

module.exports = { create, accept, complete, list, mine, pending, cancel, start };
