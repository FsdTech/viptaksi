const { Pool } = require("pg");
const { loadEnv } = require("./env");

let pool;

function getPool() {
  if (!pool) {
    const env = loadEnv();
    pool = env.databaseUrl
      ? new Pool({ connectionString: env.databaseUrl })
      : new Pool(env.pgConfig);
    pool.on("error", (err) => {
      console.error("Unexpected PG client error", err);
    });
  }
  return pool;
}

async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

module.exports = { getPool, query };
