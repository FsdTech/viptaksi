/**
 * price = baseFare + (km * perKm) + (minutes * perMin)
 */
function calculateTripPrice({
  baseFare,
  perKmRate,
  perMinRate,
  distanceKm,
  durationMin,
  shortDistanceMinFare,
}) {
  const km = Number(distanceKm) || 0;
  const min = Number(durationMin) || 0;
  const base = Number(baseFare) || 0;
  const pk = Number(perKmRate) || 0;
  const pm = Number(perMinRate) || 0;
  const raw = base + km * pk + min * pm;
  const withMin =
    typeof shortDistanceMinFare === "number" && Number.isFinite(shortDistanceMinFare)
      ? Math.max(raw, shortDistanceMinFare)
      : raw;
  return Math.round(withMin * 100) / 100;
}

module.exports = { calculateTripPrice };
