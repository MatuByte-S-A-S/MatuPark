-- Datos de ejemplo (ajustar IDs tras crear usuarios en MatuDB Auth)

INSERT INTO parking_lots (slug, name, address, phone, nit, is_open, schedule)
VALUES (
  'demo-parqueadero',
  'Parqueadero Demo ParkingPro',
  'Calle 100 # 15-20, Bogotá',
  '3001234567',
  '900123456-1',
  true,
  'Lun - Dom: 6:00 AM - 10:00 PM'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO settings (parking_lot_id, max_cars, max_motos, rate_car_hour, rate_moto_hour, tolerance_minutes, billing_mode)
SELECT id, 0, 0, 5000, 3000, 10, 'full_hour'
FROM parking_lots WHERE slug = 'demo-parqueadero'
ON CONFLICT (parking_lot_id) DO NOTHING;

-- Crear usuario admin en MatuDB Auth, luego:
-- INSERT INTO users (id, email, full_name, role, parking_lot_id)
-- SELECT '<auth-user-uuid>', 'admin@demo.com', 'Administrador Demo', 'admin', id
-- FROM parking_lots WHERE slug = 'demo-parqueadero';
