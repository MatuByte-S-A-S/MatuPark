-- Migración para bases existentes (ejecutar si ya tienes schema v1)
-- Agrega caja, métodos de pago y columnas nuevas

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

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'adjustment')),
  category VARCHAR(60),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR(40),
  reference_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_sessions_parking ON cash_sessions(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(parking_lot_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_parking ON cash_movements(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(cash_session_id);
