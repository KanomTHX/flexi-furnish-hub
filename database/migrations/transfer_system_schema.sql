-- Transfer System Database Schema
-- Created: 2024
-- Purpose: New transfer system for warehouse-to-warehouse product transfers

-- Transfer Requests Table
CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    destination_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    required_date TIMESTAMP WITH TIME ZONE,
    approval_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rejection_reason TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Request Items Table
CREATE TABLE transfer_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_request_id UUID NOT NULL REFERENCES transfer_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    approved_quantity INTEGER CHECK (approved_quantity >= 0),
    transferred_quantity INTEGER NOT NULL DEFAULT 0 CHECK (transferred_quantity >= 0),
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Shipments Table
CREATE TABLE transfer_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    transfer_request_id UUID NOT NULL REFERENCES transfer_requests(id),
    shipped_by UUID NOT NULL REFERENCES auth.users(id),
    received_by UUID REFERENCES auth.users(id),
    carrier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    shipping_method VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'shipped', 'in_transit', 'delivered', 'cancelled')),
    ship_date TIMESTAMP WITH TIME ZONE,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Shipment Items Table
CREATE TABLE transfer_shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_shipment_id UUID NOT NULL REFERENCES transfer_shipments(id) ON DELETE CASCADE,
    transfer_request_item_id UUID NOT NULL REFERENCES transfer_request_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    shipped_quantity INTEGER NOT NULL CHECK (shipped_quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
    damaged_quantity INTEGER NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Serial Numbers Table (for serialized products)
CREATE TABLE transfer_serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_shipment_item_id UUID NOT NULL REFERENCES transfer_shipment_items(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    status VARCHAR(20) NOT NULL DEFAULT 'shipped' CHECK (status IN ('shipped', 'received', 'damaged', 'missing')),
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Documents Table
CREATE TABLE transfer_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_request_id UUID REFERENCES transfer_requests(id),
    transfer_shipment_id UUID REFERENCES transfer_shipments(id),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('transfer_request', 'approval', 'shipping_label', 'packing_list', 'receipt', 'invoice', 'other')),
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Transfer Audit Log Table
CREATE TABLE transfer_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_request_id UUID REFERENCES transfer_requests(id),
    transfer_shipment_id UUID REFERENCES transfer_shipments(id),
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_transfer_requests_status ON transfer_requests(status);
CREATE INDEX idx_transfer_requests_source_warehouse ON transfer_requests(source_warehouse_id);
CREATE INDEX idx_transfer_requests_destination_warehouse ON transfer_requests(destination_warehouse_id);
CREATE INDEX idx_transfer_requests_requested_by ON transfer_requests(requested_by);
CREATE INDEX idx_transfer_requests_request_date ON transfer_requests(request_date);
CREATE INDEX idx_transfer_requests_number ON transfer_requests(request_number);

CREATE INDEX idx_transfer_request_items_transfer_id ON transfer_request_items(transfer_request_id);
CREATE INDEX idx_transfer_request_items_product_id ON transfer_request_items(product_id);

CREATE INDEX idx_transfer_shipments_status ON transfer_shipments(status);
CREATE INDEX idx_transfer_shipments_transfer_request ON transfer_shipments(transfer_request_id);
CREATE INDEX idx_transfer_shipments_number ON transfer_shipments(shipment_number);
CREATE INDEX idx_transfer_shipments_ship_date ON transfer_shipments(ship_date);

CREATE INDEX idx_transfer_shipment_items_shipment_id ON transfer_shipment_items(transfer_shipment_id);
CREATE INDEX idx_transfer_shipment_items_product_id ON transfer_shipment_items(product_id);

CREATE INDEX idx_transfer_serial_numbers_shipment_item ON transfer_serial_numbers(transfer_shipment_item_id);
CREATE INDEX idx_transfer_serial_numbers_serial ON transfer_serial_numbers(serial_number);
CREATE INDEX idx_transfer_serial_numbers_product ON transfer_serial_numbers(product_id);

CREATE INDEX idx_transfer_documents_request_id ON transfer_documents(transfer_request_id);
CREATE INDEX idx_transfer_documents_shipment_id ON transfer_documents(transfer_shipment_id);
CREATE INDEX idx_transfer_documents_type ON transfer_documents(document_type);

CREATE INDEX idx_transfer_audit_log_request_id ON transfer_audit_log(transfer_request_id);
CREATE INDEX idx_transfer_audit_log_shipment_id ON transfer_audit_log(transfer_shipment_id);
CREATE INDEX idx_transfer_audit_log_performed_by ON transfer_audit_log(performed_by);
CREATE INDEX idx_transfer_audit_log_created_at ON transfer_audit_log(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_audit_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on business requirements)
CREATE POLICY "Users can view transfer requests from their warehouses" ON transfer_requests
    FOR SELECT USING (
        source_warehouse_id IN (
            SELECT warehouse_id FROM user_warehouse_access 
            WHERE user_id = auth.uid()
        ) OR 
        destination_warehouse_id IN (
            SELECT warehouse_id FROM user_warehouse_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create transfer requests from their warehouses" ON transfer_requests
    FOR INSERT WITH CHECK (
        source_warehouse_id IN (
            SELECT warehouse_id FROM user_warehouse_access 
            WHERE user_id = auth.uid() AND can_transfer = true
        )
    );

CREATE POLICY "Users can update transfer requests they created or have approval rights" ON transfer_requests
    FOR UPDATE USING (
        requested_by = auth.uid() OR 
        source_warehouse_id IN (
            SELECT warehouse_id FROM user_warehouse_access 
            WHERE user_id = auth.uid() AND can_approve_transfers = true
        )
    );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transfer_requests_updated_at BEFORE UPDATE ON transfer_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_request_items_updated_at BEFORE UPDATE ON transfer_request_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_shipments_updated_at BEFORE UPDATE ON transfer_shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_shipment_items_updated_at BEFORE UPDATE ON transfer_shipment_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_serial_numbers_updated_at BEFORE UPDATE ON transfer_serial_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for business logic
CREATE OR REPLACE FUNCTION calculate_transfer_request_totals(request_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE transfer_requests 
    SET 
        total_items = (
            SELECT COALESCE(SUM(requested_quantity), 0)
            FROM transfer_request_items 
            WHERE transfer_request_id = request_id
        ),
        total_value = (
            SELECT COALESCE(SUM(total_cost), 0)
            FROM transfer_request_items 
            WHERE transfer_request_id = request_id
        )
    WHERE id = request_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate totals when items are modified
CREATE OR REPLACE FUNCTION trigger_calculate_transfer_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_transfer_request_totals(OLD.transfer_request_id);
        RETURN OLD;
    ELSE
        -- Calculate total_cost for the item
        NEW.total_cost = NEW.requested_quantity * NEW.unit_cost;
        PERFORM calculate_transfer_request_totals(NEW.transfer_request_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transfer_request_items_totals
    AFTER INSERT OR UPDATE OR DELETE ON transfer_request_items
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_transfer_totals();

-- Function to generate transfer request numbers
CREATE OR REPLACE FUNCTION generate_transfer_request_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 'TR-\d{8}-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM transfer_requests
    WHERE request_number LIKE 'TR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    -- Format as TR-YYYYMMDD-NNNN
    formatted_number := 'TR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate shipment numbers
CREATE OR REPLACE FUNCTION generate_shipment_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(shipment_number FROM 'SH-\d{8}-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM transfer_shipments
    WHERE shipment_number LIKE 'SH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    -- Format as SH-YYYYMMDD-NNNN
    formatted_number := 'SH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate request numbers
CREATE OR REPLACE FUNCTION trigger_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        NEW.request_number := generate_transfer_request_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transfer_requests_number
    BEFORE INSERT ON transfer_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_generate_request_number();

-- Trigger to auto-generate shipment numbers
CREATE OR REPLACE FUNCTION trigger_generate_shipment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shipment_number IS NULL OR NEW.shipment_number = '' THEN
        NEW.shipment_number := generate_shipment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transfer_shipments_number
    BEFORE INSERT ON transfer_shipments
    FOR EACH ROW EXECUTE FUNCTION trigger_generate_shipment_number();

-- Comments for documentation
COMMENT ON TABLE transfer_requests IS 'Main table for transfer requests between warehouses';
COMMENT ON TABLE transfer_request_items IS 'Items included in each transfer request';
COMMENT ON TABLE transfer_shipments IS 'Physical shipments for transfer requests';
COMMENT ON TABLE transfer_shipment_items IS 'Items included in each shipment';
COMMENT ON TABLE transfer_serial_numbers IS 'Serial numbers for serialized products in transfers';
COMMENT ON TABLE transfer_documents IS 'Documents related to transfers (PDFs, images, etc.)';
COMMENT ON TABLE transfer_audit_log IS 'Audit trail for all transfer-related actions';