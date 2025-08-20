-- Add missing foreign key constraints for product_id references
-- This ensures data integrity across the system

-- Add foreign key constraint for invoice_line_items.product_id
DO $$
BEGIN
    -- Check if the constraint doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'invoice_line_items' 
        AND constraint_name = 'fk_invoice_line_items_product_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.invoice_line_items 
        ADD CONSTRAINT fk_invoice_line_items_product_id 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint for invoice_line_items.product_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint for invoice_line_items.product_id already exists';
    END IF;
END $$;

-- Add foreign key constraint for stock_alerts.product_id (if table exists)
DO $$
BEGIN
    -- Check if stock_alerts table exists and constraint doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'stock_alerts' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'stock_alerts' 
        AND constraint_name = 'fk_stock_alerts_product_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.stock_alerts 
        ADD CONSTRAINT fk_stock_alerts_product_id 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for stock_alerts.product_id';
    ELSE
        RAISE NOTICE 'stock_alerts table does not exist or foreign key constraint already exists';
    END IF;
END $$;

-- Add foreign key constraint for supplier_products.product_id (if not exists)
DO $$
BEGIN
    -- Check if the constraint doesn't already exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'supplier_products' 
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'supplier_products' 
        AND constraint_name = 'fk_supplier_products_product_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE public.supplier_products 
        ADD CONSTRAINT fk_supplier_products_product_id 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint for supplier_products.product_id';
    ELSE
        RAISE NOTICE 'supplier_products table does not exist or foreign key constraint already exists';
    END IF;
END $$;

-- Verify all foreign key constraints are in place
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Count foreign key constraints that reference products table
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'products'
    AND tc.table_schema = 'public';
    
    RAISE NOTICE 'Total foreign key constraints referencing products table: %', constraint_count;
END $$;