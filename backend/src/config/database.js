const { pool } = require("../db");

function getPool() {
  return pool;
}

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { getPool, query };
