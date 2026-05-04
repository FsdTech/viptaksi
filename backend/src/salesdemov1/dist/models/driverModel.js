"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDemoDriver = insertDemoDriver;
exports.deleteDemoDriversByIds = deleteDemoDriversByIds;
const connection_1 = require("../db/connection");
const demoSafety_1 = require("../utils/demoSafety");
async function insertDemoDriver(client, params) {
    const sql = `
    INSERT INTO drivers (
      user_id, vehicle_type_id, is_online, lat, lng, rating, is_demo
    )
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id
  `;
    const values = [
        params.userId,
        params.vehicleTypeId,
        params.isOnline,
        params.lat,
        params.lng,
        params.rating,
    ];
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const { rows } = (await runner(sql, values));
    return { id: rows[0].id };
}
/**
 * Deletes demo drivers by id. Refuses if the delete would remove every demo driver.
 */
async function deleteDemoDriversByIds(client, ids) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0)
        return 0;
    const runner = client ? (text, p) => client.query(text, p) : connection_1.query;
    const totalR = (await runner(`SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true`));
    const totalDemo = Number(totalR.rows[0]?.c ?? 0);
    const hitR = (await runner(`SELECT COUNT(*)::text AS c FROM drivers WHERE is_demo = true AND id = ANY($1::uuid[])`, [unique]));
    const wouldDelete = Number(hitR.rows[0]?.c ?? 0);
    if (totalDemo > 0 && wouldDelete >= totalDemo) {
        throw new demoSafety_1.DemoSafetyError("Demo protection: cannot delete all demo drivers. Leave at least one demo driver, or use the isolated demo reset pipeline.");
    }
    const del = await runner(`DELETE FROM drivers WHERE is_demo = true AND id = ANY($1::uuid[])`, [
        unique,
    ]);
    return del.rowCount ?? 0;
}
