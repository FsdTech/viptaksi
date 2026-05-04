import type pg from "pg";
import { query } from "../db/connection";

export type PaymentStatusDb = "pending" | "approved" | "rejected";

export async function insertDemoPayment(
  client: pg.PoolClient | null,
  params: {
    driverId: string;
    amount: number;
    status: PaymentStatusDb;
    expireAt: Date | null;
    createdAt: Date;
    planType: string;
    receiptUrl: string | null;
  }
): Promise<{ id: string }> {
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
  const runner = client ? (text: string, p?: unknown[]) => client.query(text, p) : query;
  const { rows } = await runner(sql, values) as { rows: { id: string }[] };
  return { id: rows[0]!.id };
}
