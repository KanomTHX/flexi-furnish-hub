-- Fix products table structure to match actual database
-- Change 'code' field to 'product_code' to align with existing database schema

-- First, check if products table exists and has 'code' column
DO $$
BEGIN
    -- If products table exists with 'code' column, rename it to 'product_code'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'code'
        AND table_schema = 'public'
    ) THEN
        -- Rename the column from 'code' to 'product_code'
        ALTER TABLE public.products RENAME COLUMN code TO product_code;
        
        -- Update the unique constraint name if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'products' 
            AND constraint_name = 'products_code_key'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME CONSTRAINT products_code_key TO products_product_code_key;
        END IF;
        
        RAISE NOTICE 'Successfully renamed products.code to products.product_code';
    ELSE
        -- If 'code' column doesn't exist, check if 'product_code' already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'product_code'
            AND table_schema = 'public'
        ) THEN
            -- Add product_code column if it doesn't exist
            ALTER TABLE public.products ADD COLUMN product_code VARCHAR(50) UNIQUE NOT NULL DEFAULT 'TEMP_' || gen_random_uuid()::text;
            RAISE NOTICE 'Added product_code column to products table';
        ELSE
            RAISE NOTICE 'products.product_code column already exists';
        END IF;
    END IF;
    
    -- Ensure other required columns exist with correct data types
    
    -- Add category_id if it doesn't exist (for compatibility with POS system)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'category_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES product_categories(id);
        RAISE NOTICE 'Added category_id column to products table';
    END IF;
    
    -- Ensure cost_price column exists (some schemas use unit_cost)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'cost_price'
        AND table_schema = 'public'
    ) THEN
        -- Check if unit_cost exists and rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'unit_cost'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN unit_cost TO cost_price;
            RAISE NOTICE 'Renamed unit_cost to cost_price';
        ELSE
            ALTER TABLE public.products ADD COLUMN cost_price NUMERIC(10,2) DEFAULT 0;
            RAISE NOTICE 'Added cost_price column to products table';
        END IF;
    END IF;
    
    -- Add min_stock_level and max_stock_level if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'min_stock_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN min_stock_level INTEGER DEFAULT 0;
        RAISE NOTICE 'Added min_stock_level column to products table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'max_stock_level'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN max_stock_level INTEGER DEFAULT 1000;
        RAISE NOTICE 'Added max_stock_level column to products table';
    END IF;
    
    -- Ensure unit column exists with proper default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unit'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN unit VARCHAR(20) DEFAULT 'ชิ้น';
        RAISE NOTICE 'Added unit column to products table';
    END IF;
    
    -- Ensure status column exists with proper check constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        
        -- Add check constraint for status
        ALTER TABLE public.products ADD CONSTRAINT products_status_check 
        CHECK (status IN ('active', 'inactive', 'discontinued'));
        
        RAISE NOTICE 'Added status column with check constraint to products table';
    END IF;
    
END $$;

-- Update indexes to use product_code instead of code
DO $$
BEGIN
    -- Drop old index on 'code' if it exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' 
        AND indexname = 'idx_products_code'
    ) THEN
        DROP INDEX IF EXISTS idx_products_code;
        RAISE NOTICE 'Dropped old idx_products_code index';
    END IF;
    
    -- Create new index on 'product_code' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'products' 
        AND indexname = 'idx_products_product_code'
    ) THEN
        CREATE INDEX idx_products_product_code ON public.products(product_code);
        RAISE NOTICE 'Created idx_products_product_code index';
    END IF;
END $$;

-- Update any functions that reference products.code to use products.product_code
DO $$
BEGIN
    -- Update generate_serial_number function if it exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_serial_number'
    ) THEN
        CREATE OR REPLACE FUNCTION generate_serial_number(
            product_code_param TEXT,
            warehouse_code TEXT DEFAULT NULL
        ) RETURNS TEXT AS $func$
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
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Updated generate_serial_number function to use product_code';
    END IF;
    
    -- Update get_stock_levels function if it exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_stock_levels'
    ) THEN
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
        ) AS $func$
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
        $func$ LANGUAGE plpgsql;
        
        RAISE NOTICE 'Updated get_stock_levels function to use product_code';
    END IF;
END $$;

-- Update stock_summary_view to use product_code
DO $$
BEGIN
    -- Drop and recreate the view with correct column reference
    DROP VIEW IF EXISTS stock_summary_view;
    
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
    
    RAISE NOTICE 'Updated stock_summary_view to use product_code';
END $$;

-- Add comment to document the change
COMMENT ON COLUMN products.product_code IS 'Product code - renamed from code to match existing database schema';

RAISE NOTICE 'Migration completed: products table structure updated to match actual database schema';