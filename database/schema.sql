-- ParkingPro — Esquema completo MatuDB (PostgreSQL)
-- Ejecutar en tu instancia MatuDB antes de usar la app

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Parqueaderos ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parking_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  nit VARCHAR(30) DEFAULT '',
  logo_url TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  schedule VARCHAR(120) DEFAULT 'Lun - Dom: 24 horas',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_lots_slug ON parking_lots(slug);

-- ─── Usuarios (perfil vinculado a auth de MatuDB) ───────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator')),
  parking_lot_id UUID REFERENCES parking_lots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_parking ON users(parking_lot_id);

-- ─── Configuración por parqueadero ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID UNIQUE NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  max_cars INT NOT NULL DEFAULT 0,
  max_motos INT NOT NULL DEFAULT 0,
  rate_car_hour NUMERIC(12,2) NOT NULL DEFAULT 5000,
  rate_moto_hour NUMERIC(12,2) NOT NULL DEFAULT 3000,
  rate_car_day NUMERIC(12,2),
  rate_moto_day NUMERIC(12,2),
  tolerance_minutes INT NOT NULL DEFAULT 10,
  billing_mode VARCHAR(20) NOT NULL DEFAULT 'full_hour' CHECK (billing_mode IN ('full_hour', 'proportional')),
  currency_code VARCHAR(3) NOT NULL DEFAULT 'COP',
  currency_locale VARCHAR(10) NOT NULL DEFAULT 'es-CO',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vehículos registrados ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('car', 'moto')),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  UNIQUE (plate, parking_lot_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_parking ON vehicles(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- ─── Caja (sesiones) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  opened_by UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(12,2),
  expected_amount NUMERIC(12,2),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_parking ON cash_sessions(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(parking_lot_id, status);

-- ─── Tickets ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  plate VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(10) NOT NULL CHECK (vehicle_type IN ('car', 'moto')),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  entry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exit_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FINALIZED')),
  observations TEXT,
  amount_paid NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_plate ON tickets(plate);
CREATE INDEX IF NOT EXISTS idx_tickets_parking ON tickets(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_tickets_parking_status ON tickets(parking_lot_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_entry ON tickets(entry_at);

-- ─── Pagos ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  method VARCHAR(40) NOT NULL DEFAULT 'cash' CHECK (
    method IN ('cash', 'card', 'transfer', 'nequi', 'daviplata', 'other')
  ),
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_parking ON payments(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(cash_session_id);

-- ─── Movimientos de caja (gastos, ingresos extra, ajustes manuales) ─────────
-- Los cobros por salida de vehículos viven en `payments` (cash_session_id + ticket_id).
-- La app arma el libro de caja uniendo payments + cash_movements + apertura.
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
  category VARCHAR(60),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(40) CHECK (
    payment_method IS NULL OR payment_method IN ('cash', 'card', 'transfer', 'nequi', 'daviplata', 'other')
  ),
  reference_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_parking ON cash_movements(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);

-- ─── Reportes guardados (opcional) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  vehicles_served INT NOT NULL DEFAULT 0,
  cars_count INT NOT NULL DEFAULT 0,
  motos_count INT NOT NULL DEFAULT 0,
  daily_average NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_parking ON reports(parking_lot_id);

-- ─── Realtime (MatuDB) ────────────────────────────────────────────────────────
-- Habilita realtime en: tickets, payments, settings, cash_sessions, cash_movements
