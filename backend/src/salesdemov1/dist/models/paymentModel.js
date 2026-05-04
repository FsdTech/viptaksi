"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDemoPayment = insertDemoPayment;
const connection_1 = require("../db/connection");
async function insertDemoPayment(client, params) {
    const sql = `
    INSERT INTO payments (
      driver_id, amount, status, expire_at, plan_type, receipt_url, created_at, is_demo
    )
    VALUES ($1, $2, $3::payment_status, $4, $5, $6, $7, true)
    RETURNING id
  `;
    const values = [
        params.driverId,
        params.amount,
        params.status,
        params.expireAt,
        params.planType,
        params.receiptUrl,
        params.createdAt,
    ];
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const { rows } = await runner(sql, values);
    return { id: rows[0].id };
}
