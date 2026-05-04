let ioInstance = null;

function setSocketServer(io) {
  ioInstance = io;
}

function getSocketServer() {
  return ioInstance;
}

/**
 * @param {string} event
 * @param {unknown} payload
 */
function emitToAdmins(event, payload) {
  if (!ioInstance) return;
  ioInstance.to("admin").emit(event, payload);
}

/* EKLENDİ */
function emitToRoom(room, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
}

module.exports = { setSocketServer, getSocketServer, emitToAdmins, emitToRoom };
