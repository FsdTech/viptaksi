"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDemoUser = insertDemoUser;
exports.deleteDemoUsersByIds = deleteDemoUsersByIds;
const connection_1 = require("../db/connection");
const demoSafety_1 = require("../utils/demoSafety");
async function insertDemoUser(client, params) {
    const sql = `
    INSERT INTO users (name, email, phone, password_hash, role, is_demo)
    VALUES ($1, $2, $3, $4, $5::user_role, true)
    RETURNING id
  `;
    const values = [params.name, params.email, params.phone, params.passwordHash, params.role];
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const { rows } = (await runner(sql, values));
    return { id: rows[0].id };
}
/**
 * Deletes demo users by id. Refuses if the delete would remove every demo user (sales safety).
 */
async function deleteDemoUsersByIds(client, ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0)
        return 0;
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const totalR = (await runner(`SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true`));
    const totalDemo = Number(totalR.rows[0]?.c ?? 0);
    const hitR = (await runner(`SELECT COUNT(*)::text AS c FROM users WHERE is_demo = true AND id = ANY($1::uuid[])`, [unique]));
    const wouldDelete = Number(hitR.rows[0]?.c ?? 0);
    if (totalDemo > 0 && wouldDelete >= totalDemo) {
        throw new demoSafety_1.DemoSafetyError("Demo protection: cannot delete all demo users. Leave at least one demo user, or use the isolated demo reset pipeline.");
    }
    const del = await runner(`DELETE FROM users WHERE is_demo = true AND id = ANY($1::uuid[])`, [
        unique,
    ]);
    return del.rowCount ?? 0;
}
