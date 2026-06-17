-- Suscripciones SaaS MatuPark (pagos vía PayMatuByte)

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_lot_id UUID NOT NULL REFERENCES parking_lots(id) ON DELETE CASCADE,
  plan_id VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  payment_reference VARCHAR(120),
  amount NUMERIC(12,2),
  currency VARCHAR(3) NOT NULL DEFAULT 'COP',
  link_id VARCHAR(120),
  transaction_id VARCHAR(120),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_parking ON subscriptions(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_ref ON subscriptions(payment_reference);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(parking_lot_id, status);
