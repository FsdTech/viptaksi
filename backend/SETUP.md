# VipStar Taksi — Backend setup

## Prerequisites

- Node.js 18+
- PostgreSQL 13+ with an empty database (for example `viptaksi`)

## 1. Install dependencies

```bash
cd backend
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` if needed, then set:

- `DATABASE_URL` — PostgreSQL connection string (recommended), **or** `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `JWT_SECRET` — long random string (required to be strong in `NODE_ENV=production`)
- `PORT` — HTTP port (default `4000`)
- `CORS_ORIGIN` — comma-separated allowed browser origins (include your admin app URL, e.g. `http://localhost:5173`)

## 3. Create schema and seed admin

Apply DDL and seed data (vehicle types are inserted by `sql/schema.sql`):

```bash
npm run db:schema
npm run db:seed
```

Default admin (override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`):

- Email: `admin@viptaksi.local`
- Password: `Admin123!`

**Note:** `sql/schema.sql` is intended for a **fresh** database. Re-running on the same DB will fail on existing enums/tables. For a clean reset, drop and recreate the database.

## 4. Run the server

```bash
npm run dev
```

or

```bash
npm start
```

- REST base: `http://localhost:4000` (or your `PORT`)
- Health: `GET /health`
- Socket.IO shares the same HTTP server; connect with a JWT (`auth.token` or `Authorization: Bearer …` on the handshake).

## 5. Admin panel alignment

Point the admin app `VITE_API_URL` at this server (no trailing slash required), for example `http://localhost:4000`.

Protected admin routes expect `Authorization: Bearer <token>` from `POST /auth/login`.

## Realtime events

| Direction | Event | Purpose |
|-----------|--------|---------|
| Client → server | `driver:location:update` | Driver sends `{ lat, lng }`; optional ack callback `(result) => void` |
| Server → admins | `admin:drivers:update` | Payload `{ generatedAt, drivers: [...] }` after location changes (REST or socket) |

Admins are joined to room `admin` automatically on connection when the JWT role is `admin`.

## Trip pricing

Quoted and completed prices use:

`baseFare + (distanceKm × perKmRate) + (durationMin × perMinRate)`

Distance is Haversine between start and end coordinates. Adjust rates per class in `vehicle_types` (via `PUT /vehicle-types/update` or SQL).

## REST overview (auth via `Authorization: Bearer <token>` unless noted)

| Method | Path | Who |
|--------|------|-----|
| POST | `/auth/register` | Public (`role`: `rider` \| `driver`) |
| POST | `/auth/login` | Public |
| GET | `/drivers` | Public (read-only list) |
| POST | `/drivers/update-location` | Driver |
| POST | `/drivers/toggle-online` | Driver (`is_online` optional boolean; toggles if omitted) |
| GET | `/vehicle-types` | Public |
| PUT | `/vehicle-types/update` | Admin — JSON array `[{ id, name?, base_fare?, per_km_rate?, per_min_rate?, is_active? }]` |
| GET | `/trips` | Admin |
| POST | `/trips/create` | Rider — `vehicle_type_id`, `start_lat`, `start_lng`, `end_lat`, `end_lng`, `estimated_duration_min` |
| POST | `/trips/accept` | Driver — `trip_id` |
| POST | `/trips/complete` | Driver — `trip_id`, optional `actual_duration_min`, `end_lat`, `end_lng` |
| GET | `/payments` | Admin |
| POST | `/payments/approve` | Admin — `payment_id`, optional `expire_at` (ISO), optional `validity_days` (default 30) |
