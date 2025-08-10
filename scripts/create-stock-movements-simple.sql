-- Create stock_movements table for real stock tracking
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  batch_id UUID,
  serial_numbers TEXT[]
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_warehouse ON stock_movements (product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type);

-- Enable RLS
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON stock_movements;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_movements;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stock_movements;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stock_movements;

CREATE POLICY "Enable read access for all users" ON stock_movements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON stock_movements FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON stock_movements FOR DELETE USING (true);

-- Insert initial stock data
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, unit_cost, total_cost, reference_number, notes)
SELECT 
  p.id as product_id,
  w.id as warehouse_id,
  'in' as movement_type,
  CASE 
    WHEN p.product_code = 'SOFA-001' AND w.code = 'WH-001' THEN 25
    WHEN p.product_code = 'TABLE-002' AND w.code = 'WH-002' THEN 15
    WHEN p.product_code = 'CHAIR-003' AND w.code = 'WH-001' THEN 8
    WHEN p.product_code = 'BED-004' AND w.code = 'WH-003' THEN 30
    WHEN p.product_code = 'WARDROBE-005' AND w.code = 'WH-001' THEN 12
    ELSE FLOOR(RANDOM() * 20 + 5)::INTEGER
  END as quantity,
  COALESCE(p.cost_price, p.selling_price, 1000) as unit_cost,
  CASE 
    WHEN p.product_code = 'SOFA-001' AND w.code = 'WH-001' THEN 25 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'TABLE-002' AND w.code = 'WH-002' THEN 15 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'CHAIR-003' AND w.code = 'WH-001' THEN 8 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'BED-004' AND w.code = 'WH-003' THEN 30 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'WARDROBE-005' AND w.code = 'WH-001' THEN 12 * COALESCE(p.cost_price, p.selling_price, 1000)
    ELSE FLOOR(RANDOM() * 20 + 5)::INTEGER * COALESCE(p.cost_price, p.selling_price, 1000)
  END as total_cost,
  'INIT-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || p.product_code as reference_number,
  'Initial stock for ' || p.name || ' in ' || w.name as notes
FROM products p
CROSS JOIN warehouses w
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements sm 
  WHERE sm.product_id = p.id AND sm.warehouse_id = w.id
);

-- Add some outbound movements to create realistic stock levels
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, unit_cost, total_cost, reference_number, notes)
SELECT 
  p.id as product_id,
  w.id as warehouse_id,
  'out' as movement_type,
  CASE 
    WHEN p.product_code = 'SOFA-001' AND w.code = 'WH-001' THEN 5
    WHEN p.product_code = 'TABLE-002' AND w.code = 'WH-002' THEN 3
    WHEN p.product_code = 'CHAIR-003' AND w.code = 'WH-001' THEN 2
    WHEN p.product_code = 'BED-004' AND w.code = 'WH-003' THEN 8
    WHEN p.product_code = 'WARDROBE-005' AND w.code = 'WH-001' THEN 3
    ELSE FLOOR(RANDOM() * 5 + 1)::INTEGER
  END as quantity,
  COALESCE(p.cost_price, p.selling_price, 1000) as unit_cost,
  CASE 
    WHEN p.product_code = 'SOFA-001' AND w.code = 'WH-001' THEN 5 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'TABLE-002' AND w.code = 'WH-002' THEN 3 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'CHAIR-003' AND w.code = 'WH-001' THEN 2 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'BED-004' AND w.code = 'WH-003' THEN 8 * COALESCE(p.cost_price, p.selling_price, 1000)
    WHEN p.product_code = 'WARDROBE-005' AND w.code = 'WH-001' THEN 3 * COALESCE(p.cost_price, p.selling_price, 1000)
    ELSE FLOOR(RANDOM() * 5 + 1)::INTEGER * COALESCE(p.cost_price, p.selling_price, 1000)
  END as total_cost,
  'SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || p.product_code as reference_number,
  'Sale of ' || p.name || ' from ' || w.name as notes
FROM products p
CROSS JOIN warehouses w
WHERE EXISTS (
  SELECT 1 FROM stock_movements sm 
  WHERE sm.product_id = p.id AND sm.warehouse_id = w.id AND sm.movement_type = 'in'
);

-- Verify the data
SELECT 
  'Stock movements created' as status,
  COUNT(*) as total_movements,
  COUNT(CASE WHEN movement_type = 'in' THEN 1 END) as inbound_movements,
  COUNT(CASE WHEN movement_type = 'out' THEN 1 END) as outbound_movements
FROM stock_movements;