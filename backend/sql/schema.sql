-- VipStar Taksi — PostgreSQL schema
-- Requires: PostgreSQL 13+ (built-in gen_random_uuid)

CREATE TYPE user_role AS ENUM ('admin', 'driver', 'rider');
CREATE TYPE trip_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL UNIQUE,
  base_fare NUMERIC(10, 2) NOT NULL CHECK (base_fare >= 0),
  per_km_rate NUMERIC(10, 2) NOT NULL CHECK (per_km_rate >= 0),
  per_min_rate NUMERIC(10, 2) NOT NULL CHECK (per_min_rate >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(32),
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types (id),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_vehicle_type ON drivers (vehicle_type_id);
CREATE INDEX idx_drivers_online ON drivers (is_online) WHERE is_online = TRUE;

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES drivers (id) ON DELETE SET NULL,
  rider_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  vehicle_type_id UUID NOT NULL REFERENCES vehicle_types (id),
  status trip_status NOT NULL DEFAULT 'pending',
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  estimated_distance_km NUMERIC(10, 3) NOT NULL,
  estimated_duration_min NUMERIC(10, 2) NOT NULL,
  actual_duration_min NUMERIC(10, 2),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_trips_rider ON trips (rider_id);
CREATE INDEX idx_trips_driver ON trips (driver_id);
CREATE INDEX idx_trips_status ON trips (status);
CREATE INDEX idx_trips_created ON trips (created_at DESC);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  status payment_status NOT NULL DEFAULT 'pending',
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_driver ON payments (driver_id);
CREATE INDEX idx_payments_status ON payments (status);

-- Seed vehicle types (idempotent names)
INSERT INTO vehicle_types (name, base_fare, per_km_rate, per_min_rate, is_active)
VALUES
  ('Normal', 35.00, 8.50, 1.80, TRUE),
  ('Premium', 45.00, 10.00, 2.20, TRUE),
  ('VIP', 60.00, 12.50, 2.80, TRUE),
  ('Motor', 25.00, 6.00, 1.40, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Touch updated_at on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_drivers_updated BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_vehicle_types_updated BEFORE UPDATE ON vehicle_types
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_trips_updated BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER tr_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Panel yöneticileri (db.js ile senkron; uygulama init sırasında da oluşturulur)
CREATE TABLE IF NOT EXISTS admin_roles (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO admin_roles (code, display_name, sort_order) VALUES
  ('super_admin', 'Süper Admin', 1),
  ('yonetici', 'Yönetici', 2)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT REFERENCES admin_roles (code),
  status TEXT,
  password_hash TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
