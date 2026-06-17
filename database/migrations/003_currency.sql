-- Moneda regional en settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) NOT NULL DEFAULT 'COP';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency_locale VARCHAR(10) NOT NULL DEFAULT 'es-CO';
