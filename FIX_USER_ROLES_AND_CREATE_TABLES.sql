-- Fix User Roles Enum and Create Enhanced Transfer System Tables
-- Copy and paste this into Supabase SQL Editor
-- URL: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql

-- ============================================================================
-- 1. FIX USER_ROLE ENUM
-- ============================================================================

-- Add missing enum values to user_role (if enum exists)
DO $$ 
BEGIN
    -- Try to add warehouse roles to existing enum
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'warehouse_staff';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'warehouse_staff already exists in user_role enum';
        WHEN undefined_object THEN
            RAISE NOTICE 'user_role enum does not exist, will create it';
    END;
    
    BEGIN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'warehouse_manager';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'warehouse_manager already exists in user_role enum';
        WHEN undefined_object THEN
            RAISE NOTICE 'user_role enum does not exist, will create it';
    END;
END $$;

-- Create user_role enum if it doesn't exist
DO $$ 
BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'manager', 
        'employee',
        'warehouse_manager',
        'warehouse_staff',
        'sales_staff',
        'accountant'
    );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'user_role enum already exists';
END $$;

-- ============================================================================
-- 2. UPDATE EMPLOYEE_PROFILES TABLE (IF NEEDED)
-- ============================================================================

-- Check if employee_profiles.role column needs to be updated
DO $$
BEGIN
    -- Try to update the column type if it's not using the enum
    BEGIN
        ALTER TABLE employee_profiles 
        ALTER COLUMN role TYPE user_role USING role::text::user_role;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Could not update employee_profiles.role column type: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- 3. CREATE NOTIFICATIONS TABLE
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

-- ============================================================================
-- 4. CREATE PRODUCT SERIAL NUMBERS TABLE
-- ============================================================================

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

-- ============================================================================
-- 5. CREATE STOCK TRANSFERS TABLE
-- ============================================================================

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

-- ============================================================================
-- 6. CREATE STOCK TRANSFER ITEMS TABLE
-- ============================================================================

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
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CREATE RLS POLICIES (UPDATED FOR CORRECT ROLES)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Warehouse staff can access serial numbers" ON public.product_serial_numbers;
DROP POLICY IF EXISTS "Warehouse staff can access transfers" ON public.stock_transfers;
DROP POLICY IF EXISTS "Warehouse staff can access transfer items" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "Authenticated users can access serial numbers" ON public.product_serial_numbers;
DROP POLICY IF EXISTS "Authenticated users can access transfers" ON public.stock_transfers;
DROP POLICY IF EXISTS "Authenticated users can access transfer items" ON public.stock_transfer_items;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

-- Warehouse system policies (simplified for compatibility)
CREATE POLICY "Authenticated users can access serial numbers" 
ON public.product_serial_numbers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can access transfers" 
ON public.stock_transfers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can access transfer items" 
ON public.stock_transfer_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

-- ============================================================================
-- 9. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Product serial numbers indexes
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_serial_number ON public.product_serial_numbers(serial_number);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_id ON public.product_serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_warehouse_id ON public.product_serial_numbers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status ON public.product_serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_warehouse ON public.product_serial_numbers(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status_warehouse ON public.product_serial_numbers(status, warehouse_id);

-- Stock transfers indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfers_source_warehouse ON public.stock_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_target_warehouse ON public.stock_transfers(target_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_transfer_number ON public.stock_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_created_at ON public.stock_transfers(created_at DESC);

-- Stock transfer items indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON public.stock_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_serial_number_id ON public.stock_transfer_items(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product_id ON public.stock_transfer_items(product_id);

-- ============================================================================
-- 10. CREATE HELPER FUNCTIONS
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
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM stock_transfers
    WHERE transfer_number LIKE 'TF' || year_part || month_part || '%';
    
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
-- 11. GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.product_serial_numbers TO authenticated;
GRANT ALL ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfer_items TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transfer_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_levels_by_warehouse(UUID) TO authenticated;

-- ============================================================================
-- 12. INSERT SAMPLE DATA (OPTIONAL - UNCOMMENT IF NEEDED)
-- ============================================================================

/*
-- Insert sample serial numbers for testing
INSERT INTO public.product_serial_numbers (serial_number, product_id, warehouse_id, unit_cost, status)
SELECT 
    'SAMPLE-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || ROW_NUMBER() OVER(),
    p.id,
    w.id,
    1000,
    'available'
FROM products p
CROSS JOIN warehouses w
WHERE p.is_active = true AND w.status = 'active'
LIMIT 10
ON CONFLICT (serial_number) DO NOTHING;
*/

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

SELECT 'Enhanced Transfer System with fixed user roles setup completed successfully!' as result;

-- After running this SQL, test the system by running:
-- node scripts/test-system-after-setup.js