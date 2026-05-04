require("dns").setDefaultResultOrder("ipv4first");
require("./src/config/env").loadEnv();
/* EKLENDİ */
const { startServer } = require("./src/server");
/* EKLENDİ */
startServer();
