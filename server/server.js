const WebSocket = require("ws");

const PORT = 3001;

const wss = new WebSocket.Server({ port: PORT });

console.log("WS çalışıyor → ws://localhost:" + PORT);

// GERÇEKÇİ KÜÇÜK ROTALAR (denize gitmez)
const routes = {
  1: [
    [36.8969, 30.7133],
    [36.8970, 30.7135],
    [36.8971, 30.7137],
    [36.8972, 30.7139],
  ],
  2: [
    [36.8955, 30.7120],
    [36.8957, 30.7122],
    [36.8959, 30.7124],
    [36.8961, 30.7126],
  ],
  3: [
    [36.8980, 30.7150],
    [36.8982, 30.7152],
    [36.8984, 30.7154],
    [36.8986, 30.7156],
  ],
};

let cars = [
  { id: 1, i: 0, direction: 1 },
  { id: 2, i: 0, direction: -1 },
  { id: 3, i: 0, direction: 1 },
];

function moveCars() {
  cars = cars.map((c) => {
    const route = routes[c.id];

    if (!route || route.length === 0) return c;

    const nextIndex = (c.i + c.direction + route.length) % route.length;

    return { ...c, i: nextIndex };
  });
}

function buildPayload() {
  return cars.map((c) => {
    const route = routes[c.id];

    if (!route || !route[c.i]) {
      return {
        id: c.id,
        lat: 36.8969,
        lng: 30.7133,
        targetLat: 36.8969,
        targetLng: 30.7133,
      };
    }

    const [lat, lng] = route[c.i];

    return {
      id: c.id,
      lat,
      lng,
      targetLat: lat,
      targetLng: lng,
    };
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  const interval = setInterval(() => {
    moveCars();

    const data = JSON.stringify(buildPayload());

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }, 1000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});