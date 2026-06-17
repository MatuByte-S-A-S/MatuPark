-- Registros pendientes de pago (cuenta se crea al confirmar Bold)

CREATE TABLE IF NOT EXISTS pending_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  password_enc TEXT NOT NULL,
  plan_id VARCHAR(40) NOT NULL,
  payment_reference VARCHAR(120) NOT NULL UNIQUE,
  link_id VARCHAR(120),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  parking_lot_id UUID REFERENCES parking_lots(id) ON DELETE SET NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups(email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_ref ON pending_signups(payment_reference);
