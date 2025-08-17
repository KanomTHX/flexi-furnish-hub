-- Create transfer_requests table
CREATE TABLE IF NOT EXISTS transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    source_warehouse_id UUID REFERENCES warehouses(id),
    destination_warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    requested_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    required_date TIMESTAMP WITH TIME ZONE,
    approved_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    updated_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfer_request_items table
CREATE TABLE IF NOT EXISTS transfer_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_request_id UUID NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    approved_quantity INTEGER CHECK (approved_quantity >= 0),
    transferred_quantity INTEGER DEFAULT 0 CHECK (transferred_quantity >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'pieces',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_source_warehouse ON transfer_requests(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_destination_warehouse ON transfer_requests(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_created_at ON transfer_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_transfer_request_items_transfer_id ON transfer_request_items(transfer_request_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_items_product_id ON transfer_request_items(product_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfer_requests_updated_at
    BEFORE UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_request_items_updated_at
    BEFORE UPDATE ON transfer_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO transfer_requests (
    request_number,
    source_warehouse_id,
    destination_warehouse_id,
    status,
    priority,
    required_date,
    notes
) VALUES 
(
    'TR-2024-001',
    (SELECT id FROM warehouses LIMIT 1),
    (SELECT id FROM warehouses OFFSET 1 LIMIT 1),
    'pending',
    'high',
    NOW() + INTERVAL '7 days',
    'ขอโอนสินค้าเพื่อเปิดสาขาใหม่'
),
(
    'TR-2024-002',
    (SELECT id FROM warehouses OFFSET 1 LIMIT 1),
    (SELECT id FROM warehouses LIMIT 1),
    'approved',
    'medium',
    NOW() + INTERVAL '5 days',
    'เติมสต็อกสินค้าประจำ'
);

-- Insert sample transfer request items
INSERT INTO transfer_request_items (
    transfer_request_id,
    product_id,
    requested_quantity,
    approved_quantity,
    unit,
    notes
) VALUES 
(
    (SELECT id FROM transfer_requests WHERE request_number = 'TR-2024-001'),
    (SELECT id FROM products LIMIT 1),
    10,
    10,
    'ชิ้น',
    'สีดำ'
),
(
    (SELECT id FROM transfer_requests WHERE request_number = 'TR-2024-002'),
    (SELECT id FROM products OFFSET 1 LIMIT 1),
    25,
    20,
    'ชิ้น',
    ''
);

COMMIT;