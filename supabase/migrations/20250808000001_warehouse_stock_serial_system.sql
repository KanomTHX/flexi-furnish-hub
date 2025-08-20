-- Warehouse Stock System with Serial Number Support
-- Migration for comprehensive stock management with SN tracking

-- Create additional enums for the new system
CREATE TYPE sn_status AS ENUM ('available', 'sold', 'transferred', 'claimed', 'damaged', 'reserved');
CREATE TYPE movement_type AS ENUM ('receive', 'withdraw', 'transfer_out', 'transfer_in', 'adjustment', 'claim', 'return');
CREATE TYPE reference_type AS ENUM ('purchase', 'sale', 'transfer', 'adjustment', 'claim', 'return', 'pos', 'installment');
CREATE TYPE claim_type AS ENUM ('return', 'warranty', 'defective', 'exchange');
CREATE TYPE claim_resolution AS ENUM ('refund', 'exchange', 'repair', 'reject');
CREATE TYPE adjustment_type AS ENUM ('count', 'damage', 'loss', 'found', 'correction');
CREATE TYPE receive_status AS ENUM ('draft', 'completed', 'cancelled');

-- Extend products table if it doesn't exist or add missing columns
DO $$ 
BEGIN
    -- Check if products table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        CREATE TABLE public.products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            product_code VARCHAR(50) UNIQUE NOT NULL,
            sku TEXT UNIQUE,
            category_id UUID REFERENCES product_categories(id),
            category TEXT,
            brand TEXT,
            model TEXT,
            description TEXT,
            unit VARCHAR(20) DEFAULT 'ชิ้น',
            cost_price NUMERIC(10,2) DEFAULT 0,
            selling_price NUMERIC(10,2) DEFAULT 0,
            min_stock_level INTEGER DEFAULT 0,
            max_stock_level INTEGER DEFAULT 1000,
            barcode TEXT,
            image_url TEXT,
            is_active BOOLEAN DEFAULT true,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Products access for employees" 
        ON public.products 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid()
        ));
        
        -- Create trigger
        CREATE TRIGGER update_products_updated_at
        BEFORE UPDATE ON public.products
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- Add missing columns to products if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
        ALTER TABLE public.products ADD COLUMN brand TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'model') THEN
        ALTER TABLE public.products ADD COLUMN model TEXT;
    END IF;
END $$;

-- Create suppliers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        CREATE TABLE public.suppliers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            tax_id TEXT,
            payment_terms INTEGER DEFAULT 30,
            credit_limit NUMERIC(15,2) DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Suppliers access for employees" 
        ON public.suppliers 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid()
        ));
        
        -- Create trigger
        CREATE TRIGGER update_suppliers_updated_at
        BEFORE UPDATE ON public.suppliers
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create branches table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'branches') THEN
        CREATE TABLE public.branches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            address TEXT,
            phone TEXT,
            manager_id UUID,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Branches access for employees" 
        ON public.branches 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid()
        ));
        
        -- Create trigger
        CREATE TRIGGER update_branches_updated_at
        BEFORE UPDATE ON public.branches
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 1. Product Serial Numbers Table (Core SN tracking)
CREATE TABLE public.product_serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    unit_cost NUMERIC(10,2) NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id),
    invoice_number VARCHAR(100),
    status sn_status DEFAULT 'available',
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_to VARCHAR(255),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stock Movements Table (Movement logging)
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    serial_number_id UUID REFERENCES public.product_serial_numbers(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    movement_type movement_type NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10,2),
    reference_type reference_type,
    reference_id UUID,
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stock Transfers Table (Inter-warehouse transfers)
CREATE TABLE public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    target_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    status transfer_status DEFAULT 'pending',
    total_items INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    initiated_by UUID NOT NULL,
    confirmed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Stock Transfer Items Table
CREATE TABLE public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    serial_number_id UUID NOT NULL REFERENCES public.product_serial_numbers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10,2) NOT NULL,
    status transfer_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Receive Logs Table (Goods receiving tracking)
CREATE TABLE public.receive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receive_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    invoice_number VARCHAR(100),
    total_items INTEGER NOT NULL DEFAULT 0,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    received_by UUID NOT NULL,
    status receive_status DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Claim Logs Table (Returns and claims)
CREATE TABLE public.claim_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    serial_number_id UUID NOT NULL REFERENCES public.product_serial_numbers(id),
    claim_type claim_type NOT NULL,
    reason TEXT NOT NULL,
    customer_name VARCHAR(255),
    original_sale_reference VARCHAR(100),
    resolution claim_resolution,
    processed_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 7. Stock Adjustments Table (Inventory adjustments)
CREATE TABLE public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    adjustment_type adjustment_type NOT NULL,
    total_items INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    performed_by UUID NOT NULL,
    approved_by UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receive_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouse stock system
CREATE POLICY "Serial numbers access for warehouse staff" 
ON public.product_serial_numbers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Stock movements access for warehouse staff" 
ON public.stock_movements 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Stock transfers access for warehouse staff" 
ON public.stock_transfers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Stock transfer items access for warehouse staff" 
ON public.stock_transfer_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Receive logs access for warehouse staff" 
ON public.receive_logs 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Claim logs access for warehouse staff" 
ON public.claim_logs 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Stock adjustments access for warehouse staff" 
ON public.stock_adjustments 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_product_serial_numbers_updated_at
BEFORE UPDATE ON public.product_serial_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance optimization
CREATE INDEX idx_product_serial_numbers_serial_number ON public.product_serial_numbers(serial_number);
CREATE INDEX idx_product_serial_numbers_product_id ON public.product_serial_numbers(product_id);
CREATE INDEX idx_product_serial_numbers_warehouse_id ON public.product_serial_numbers(warehouse_id);
CREATE INDEX idx_product_serial_numbers_status ON public.product_serial_numbers(status);
CREATE INDEX idx_product_serial_numbers_supplier_id ON public.product_serial_numbers(supplier_id);

CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse_id ON public.stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_serial_number_id ON public.stock_movements(serial_number_id);
CREATE INDEX idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON public.stock_movements(reference_type, reference_id);

CREATE INDEX idx_stock_transfers_source_warehouse ON public.stock_transfers(source_warehouse_id);
CREATE INDEX idx_stock_transfers_target_warehouse ON public.stock_transfers(target_warehouse_id);
CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_transfer_number ON public.stock_transfers(transfer_number);

CREATE INDEX idx_stock_transfer_items_transfer_id ON public.stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_serial_number_id ON public.stock_transfer_items(serial_number_id);

CREATE INDEX idx_receive_logs_warehouse_id ON public.receive_logs(warehouse_id);
CREATE INDEX idx_receive_logs_supplier_id ON public.receive_logs(supplier_id);
CREATE INDEX idx_receive_logs_receive_number ON public.receive_logs(receive_number);
CREATE INDEX idx_receive_logs_created_at ON public.receive_logs(created_at);

CREATE INDEX idx_claim_logs_serial_number_id ON public.claim_logs(serial_number_id);
CREATE INDEX idx_claim_logs_claim_type ON public.claim_logs(claim_type);
CREATE INDEX idx_claim_logs_claim_number ON public.claim_logs(claim_number);

CREATE INDEX idx_stock_adjustments_warehouse_id ON public.stock_adjustments(warehouse_id);
CREATE INDEX idx_stock_adjustments_adjustment_type ON public.stock_adjustments(adjustment_type);
CREATE INDEX idx_stock_adjustments_status ON public.stock_adjustments(status);

-- Create indexes on products table for better search performance
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON public.products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_model ON public.products(model);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- Create composite indexes for common queries
CREATE INDEX idx_serial_numbers_product_warehouse ON public.product_serial_numbers(product_id, warehouse_id);
CREATE INDEX idx_serial_numbers_status_warehouse ON public.product_serial_numbers(status, warehouse_id);
CREATE INDEX idx_movements_product_warehouse_date ON public.stock_movements(product_id, warehouse_id, created_at);

-- Create functions for automatic serial number generation
CREATE OR REPLACE FUNCTION generate_serial_number(
    product_code_param TEXT,
    warehouse_code TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    sn TEXT;
BEGIN
    -- Get current year
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get next sequence number for this product in this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(serial_number FROM LENGTH(product_code_param) + 6) AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM product_serial_numbers psn
    JOIN products p ON psn.product_id = p.id
    WHERE p.product_code = product_code_param
    AND serial_number LIKE product_code_param || '-' || year_part || '-%';
    
    -- Format: PRODUCT_CODE-YYYY-NNN (e.g., SF001-2024-001)
    sn := product_code_param || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN sn;
END;
$$ LANGUAGE plpgsql;

-- Create function to get stock levels by warehouse
CREATE OR REPLACE FUNCTION get_stock_levels(
    warehouse_id_param UUID DEFAULT NULL,
    product_id_param UUID DEFAULT NULL
) RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_code TEXT,
    warehouse_id UUID,
    warehouse_name TEXT,
    total_quantity BIGINT,
    available_quantity BIGINT,
    sold_quantity BIGINT,
    transferred_quantity BIGINT,
    claimed_quantity BIGINT,
    damaged_quantity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.product_code as product_code,
        w.id as warehouse_id,
        w.name as warehouse_name,
        COUNT(psn.id) as total_quantity,
        COUNT(CASE WHEN psn.status = 'available' THEN 1 END) as available_quantity,
        COUNT(CASE WHEN psn.status = 'sold' THEN 1 END) as sold_quantity,
        COUNT(CASE WHEN psn.status = 'transferred' THEN 1 END) as transferred_quantity,
        COUNT(CASE WHEN psn.status = 'claimed' THEN 1 END) as claimed_quantity,
        COUNT(CASE WHEN psn.status = 'damaged' THEN 1 END) as damaged_quantity
    FROM products p
    CROSS JOIN warehouses w
    LEFT JOIN product_serial_numbers psn ON p.id = psn.product_id AND w.id = psn.warehouse_id
    WHERE (warehouse_id_param IS NULL OR w.id = warehouse_id_param)
    AND (product_id_param IS NULL OR p.id = product_id_param)
    AND p.is_active = true
    AND w.status = 'active'
    GROUP BY p.id, p.name, p.product_code, w.id, w.name
    HAVING COUNT(psn.id) > 0 OR warehouse_id_param IS NOT NULL
    ORDER BY p.name, w.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to log stock movements automatically
CREATE OR REPLACE FUNCTION log_stock_movement(
    product_id_param UUID,
    serial_number_id_param UUID,
    warehouse_id_param UUID,
    movement_type_param movement_type,
    quantity_param INTEGER,
    unit_cost_param NUMERIC DEFAULT NULL,
    reference_type_param reference_type DEFAULT NULL,
    reference_id_param UUID DEFAULT NULL,
    reference_number_param VARCHAR DEFAULT NULL,
    notes_param TEXT DEFAULT NULL,
    performed_by_param UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    movement_id UUID;
    performer_id UUID;
BEGIN
    -- Use provided performer or try to get from auth context
    performer_id := COALESCE(performed_by_param, auth.uid());
    
    -- Insert movement record
    INSERT INTO stock_movements (
        product_id,
        serial_number_id,
        warehouse_id,
        movement_type,
        quantity,
        unit_cost,
        reference_type,
        reference_id,
        reference_number,
        notes,
        performed_by
    ) VALUES (
        product_id_param,
        serial_number_id_param,
        warehouse_id_param,
        movement_type_param,
        quantity_param,
        unit_cost_param,
        reference_type_param,
        reference_id_param,
        reference_number_param,
        notes_param,
        performer_id
    ) RETURNING id INTO movement_id;
    
    RETURN movement_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically log movements when SN status changes
CREATE OR REPLACE FUNCTION trigger_log_sn_status_change() RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM log_stock_movement(
            NEW.product_id,
            NEW.id,
            NEW.warehouse_id,
            CASE 
                WHEN NEW.status = 'sold' THEN 'withdraw'::movement_type
                WHEN NEW.status = 'transferred' THEN 'transfer_out'::movement_type
                WHEN NEW.status = 'claimed' THEN 'claim'::movement_type
                WHEN NEW.status = 'damaged' THEN 'adjustment'::movement_type
                WHEN NEW.status = 'available' AND OLD.status != 'available' THEN 'adjustment'::movement_type
                ELSE 'adjustment'::movement_type
            END,
            1,
            NEW.unit_cost,
            CASE 
                WHEN NEW.status = 'sold' THEN 'sale'::reference_type
                WHEN NEW.status = 'transferred' THEN 'transfer'::reference_type
                WHEN NEW.status = 'claimed' THEN 'claim'::reference_type
                ELSE 'adjustment'::reference_type
            END,
            NULL,
            NEW.reference_number,
            'Status changed from ' || COALESCE(OLD.status::TEXT, 'NULL') || ' to ' || NEW.status::TEXT,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic movement logging
CREATE TRIGGER trigger_product_serial_numbers_status_change
    AFTER UPDATE ON public.product_serial_numbers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_sn_status_change();

-- Insert sample data for testing (optional)
-- This will be useful for development and testing
DO $$
DECLARE
    sample_warehouse_id UUID;
    sample_product_id UUID;
    sample_supplier_id UUID;
BEGIN
    -- Get or create sample warehouse
    SELECT id INTO sample_warehouse_id FROM warehouses LIMIT 1;
    
    -- Get or create sample supplier
    INSERT INTO suppliers (name, code, contact_person, phone, email)
    VALUES ('บริษัท เฟอร์นิเจอร์ จำกัด', 'SUP001', 'คุณสมชาย', '02-123-4567', 'contact@furniture.com')
    ON CONFLICT (code) DO NOTHING
    RETURNING id INTO sample_supplier_id;
    
    IF sample_supplier_id IS NULL THEN
        SELECT id INTO sample_supplier_id FROM suppliers WHERE code = 'SUP001';
    END IF;
    
    -- Insert sample products if they don't exist
    INSERT INTO products (name, product_code, sku, category, brand, model, cost_price, selling_price)
    VALUES 
        ('โซฟา 3 ที่นั่ง', 'SF001', 'SF001-BRN', 'เฟอร์นิเจอร์', 'HomePro', 'Classic-3S', 15000, 25000),
        ('โต๊ะทำงาน', 'TB001', 'TB001-OAK', 'เฟอร์นิเจอร์', 'Office+', 'Desk-120', 8000, 15000),
        ('เก้าอี้สำนักงาน', 'CH001', 'CH001-BLK', 'เฟอร์นิเจอร์', 'ErgoMax', 'Chair-Pro', 5000, 9000)
    ON CONFLICT (product_code) DO NOTHING;
    
    -- Only proceed if we have a warehouse
    IF sample_warehouse_id IS NOT NULL THEN
        -- Get sample product
        SELECT id INTO sample_product_id FROM products WHERE product_code = 'SF001';
        
        IF sample_product_id IS NOT NULL THEN
            -- Insert sample serial numbers
            INSERT INTO product_serial_numbers (serial_number, product_id, warehouse_id, unit_cost, supplier_id, status)
            VALUES 
                (generate_serial_number('SF001'), sample_product_id, sample_warehouse_id, 15000, sample_supplier_id, 'available'),
                (generate_serial_number('SF001'), sample_product_id, sample_warehouse_id, 15000, sample_supplier_id, 'available'),
                (generate_serial_number('SF001'), sample_product_id, sample_warehouse_id, 15000, sample_supplier_id, 'available')
            ON CONFLICT (serial_number) DO NOTHING;
        END IF;
    END IF;
END $$;

-- Create views for common queries
CREATE OR REPLACE VIEW stock_summary_view AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.product_code as product_code,
    p.brand,
    p.model,
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.code as warehouse_code,
    COUNT(psn.id) as total_quantity,
    COUNT(CASE WHEN psn.status = 'available' THEN 1 END) as available_quantity,
    COUNT(CASE WHEN psn.status = 'sold' THEN 1 END) as sold_quantity,
    COUNT(CASE WHEN psn.status = 'transferred' THEN 1 END) as transferred_quantity,
    COUNT(CASE WHEN psn.status = 'claimed' THEN 1 END) as claimed_quantity,
    COUNT(CASE WHEN psn.status = 'damaged' THEN 1 END) as damaged_quantity,
    COUNT(CASE WHEN psn.status = 'reserved' THEN 1 END) as reserved_quantity,
    AVG(psn.unit_cost) as average_cost,
    SUM(CASE WHEN psn.status = 'available' THEN psn.unit_cost ELSE 0 END) as available_value
FROM products p
CROSS JOIN warehouses w
LEFT JOIN product_serial_numbers psn ON p.id = psn.product_id AND w.id = psn.warehouse_id
WHERE p.is_active = true AND w.status = 'active'
GROUP BY p.id, p.name, p.product_code, p.brand, p.model, w.id, w.name, w.code;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;