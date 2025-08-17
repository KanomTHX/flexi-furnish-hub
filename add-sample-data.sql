-- Add sample products
INSERT INTO products (name, product_code, selling_price, min_stock_level, max_stock_level, status)
VALUES 
  ('โซฟา 3 ที่นั่ง', 'SF-001', 15000, 5, 50, 'active'),
  ('เก้าอี้สำนักงาน', 'CH-001', 3500, 10, 100, 'active'),
  ('โต๊ะทำงาน', 'TB-001', 8500, 3, 30, 'active')
ON CONFLICT (product_code) DO NOTHING;

-- Add sample serial numbers for testing withdraw functionality
INSERT INTO serial_numbers (product_id, warehouse_id, serial_number, status, unit_cost)
SELECT 
  p.id,
  w.id,
  p.product_code || '-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  'available',
  p.selling_price * 0.7
FROM products p
CROSS JOIN warehouses w
WHERE p.product_code IN ('SF-001', 'CH-001', 'TB-001')
LIMIT 15;

-- Update stock levels
INSERT INTO stock_levels (product_id, warehouse_id, available_quantity, reserved_quantity, total_quantity, available_value)
SELECT 
  p.id,
  w.id,
  5,
  0,
  5,
  p.selling_price * 5 * 0.7
FROM products p
CROSS JOIN warehouses w
WHERE p.product_code IN ('SF-001', 'CH-001', 'TB-001')
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET
  available_quantity = EXCLUDED.available_quantity,
  total_quantity = EXCLUDED.total_quantity,
  available_value = EXCLUDED.available_value;