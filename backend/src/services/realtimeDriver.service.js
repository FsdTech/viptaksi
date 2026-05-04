const driverModel = require("../models/driver.model");
const { emitToAdmins } = require("../sockets/realtime.registry");

function mapSnapshotRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.user_name,
    lat: r.lat,
    lng: r.lng,
    rating: r.rating != null ? Number(r.rating) : null,
    isOnline: r.is_online,
    vehicleTypeName: r.vehicle_type_name,
  };
}

async function buildAdminDriversPayload() {
  const rows = await driverModel.listOnlineSnapshot();
  return {
    generatedAt: new Date().toISOString(),
    drivers: rows.map(mapSnapshotRow),
  };
}

async function broadcastAdminDriversUpdate() {
  const payload = await buildAdminDriversPayload();
  emitToAdmins("admin:drivers:update", payload);
  return payload;
}

module.exports = {
  buildAdminDriversPayload,
  broadcastAdminDriversUpdate,
  mapSnapshotRow,
};
