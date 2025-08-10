-- Enhanced Transfer System Database Setup
-- Run this SQL in Supabase Dashboard SQL Editor
-- URL: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql

-- ============================================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('transfer_created', 'transfer_received', 'transfer_confirmed', 'transfer_cancelled')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- ============================================================================
-- 2. CREATE WAREHOUSE SYSTEM TABLES
-- ============================================================================

-- Product Serial Numbers Table
CREATE TABLE IF NOT EXISTS public.product_serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    unit_cost NUMERIC(10,2) NOT NULL,
    supplier_id UUID,
    invoice_number VARCHAR(100),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'transferred', 'claimed', 'damaged', 'reserved')),
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_to VARCHAR(255),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Transfers Table
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    target_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'in_transit', 'delivered', 'completed', 'cancelled')),
    total_items INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    initiated_by UUID NOT NULL,
    confirmed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Stock Transfer Items Table
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    serial_number_id UUID NOT NULL REFERENCES public.product_serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'in_transit', 'delivered', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. ENABLE RLS ON WAREHOUSE TABLES
-- ============================================================================

ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICIES FOR WAREHOUSE TABLES
-- ============================================================================

-- Policies for product_serial_numbers
CREATE POLICY "Warehouse staff can access serial numbers" 
ON public.product_serial_numbers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

-- Policies for stock_transfers
CREATE POLICY "Warehouse staff can access transfers" 
ON public.stock_transfers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

-- Policies for stock_transfer_items
CREATE POLICY "Warehouse staff can access transfer items" 
ON public.stock_transfer_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for product_serial_numbers
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_serial_number ON public.product_serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_id ON public.product_serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_warehouse_id ON public.product_serial_numbers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status ON public.product_serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_warehouse ON public.product_serial_numbers(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status_warehouse ON public.product_serial_numbers(status, warehouse_id);

-- Indexes for stock_transfers
CREATE INDEX IF NOT EXISTS idx_stock_transfers_source_warehouse ON public.stock_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_target_warehouse ON public.stock_transfers(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_transfer_number ON public.stock_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_created_at ON public.stock_transfers(created_at DESC);

-- Indexes for stock_transfer_items
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON public.stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_serial_number_id ON public.stock_transfer_items(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product_id ON public.stock_transfer_items(product_id);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to generate transfer numbers
CREATE OR REPLACE FUNCTION generate_transfer_number() 
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    month_part TEXT;
    sequence_num INTEGER;
    transfer_number TEXT;
BEGIN
    -- Get current year and month
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(transfer_number FROM 9) AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM stock_transfers
    WHERE transfer_number LIKE 'TF' || year_part || month_part || '%';
    
    -- Format: TFYYYYMMNNN (e.g., TF2025010001)
    transfer_number := 'TF' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN transfer_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get stock levels by warehouse
CREATE OR REPLACE FUNCTION get_stock_levels_by_warehouse(warehouse_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_code TEXT,
    warehouse_id UUID,
    warehouse_name TEXT,
    total_quantity BIGINT,
    available_quantity BIGINT,
    sold_quantity BIGINT,
    transferred_quantity BIGINT,
    damaged_quantity BIGINT,
    average_cost NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.code as product_code,
        w.id as warehouse_id,
        w.name as warehouse_name,
        COUNT(psn.id) as total_quantity,
        COUNT(CASE WHEN psn.status = 'available' THEN 1 END) as available_quantity,
        COUNT(CASE WHEN psn.status = 'sold' THEN 1 END) as sold_quantity,
        COUNT(CASE WHEN psn.status = 'transferred' THEN 1 END) as transferred_quantity,
        COUNT(CASE WHEN psn.status = 'damaged' THEN 1 END) as damaged_quantity,
        AVG(psn.unit_cost) as average_cost
    FROM products p
    CROSS JOIN warehouses w
    LEFT JOIN product_serial_numbers psn ON p.id = psn.product_id AND w.id = psn.warehouse_id
    WHERE (warehouse_id_param IS NULL OR w.id = warehouse_id_param)
    AND p.is_active = true
    AND w.status = 'active'
    GROUP BY p.id, p.name, p.code, w.id, w.name
    HAVING COUNT(psn.id) > 0 OR warehouse_id_param IS NOT NULL
    ORDER BY p.name, w.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.product_serial_numbers TO authenticated;
GRANT ALL ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfer_items TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transfer_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_levels_by_warehouse(UUID) TO authenticated;

-- ============================================================================
-- 8. INSERT SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample serial numbers for testing (uncomment if needed)
/*
DO $$
DECLARE
    sample_warehouse_id UUID;
    sample_product_id UUID;
BEGIN
    -- Get first warehouse and product
    SELECT id INTO sample_warehouse_id FROM warehouses WHERE status = 'active' LIMIT 1;
    SELECT id INTO sample_product_id FROM products WHERE is_active = true LIMIT 1;
    
    IF sample_warehouse_id IS NOT NULL AND sample_product_id IS NOT NULL THEN
        -- Insert sample serial numbers
        INSERT INTO product_serial_numbers (serial_number, product_id, warehouse_id, unit_cost, status)
        VALUES 
            ('SN-TEST-001', sample_product_id, sample_warehouse_id, 1000, 'available'),
            ('SN-TEST-002', sample_product_id, sample_warehouse_id, 1000, 'available'),
            ('SN-TEST-003', sample_product_id, sample_warehouse_id, 1000, 'available')
        ON CONFLICT (serial_number) DO NOTHING;
    END IF;
END $$;
*/

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- After running this SQL, you can test the system by running:
-- node scripts/test-enhanced-transfer-system.js

SELECT 'Enhanced Transfer System setup completed successfully!' as status;