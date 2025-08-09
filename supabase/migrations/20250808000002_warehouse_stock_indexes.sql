-- Additional Performance Indexes for Warehouse Stock System
-- This migration adds specialized indexes for optimal query performance

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_warehouse_status 
ON public.product_serial_numbers(product_id, warehouse_id, status);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_warehouse_status_created 
ON public.product_serial_numbers(warehouse_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_status_created 
ON public.product_serial_numbers(product_id, status, created_at DESC);

-- Indexes for stock movements queries
CREATE INDEX IF NOT EXISTS idx_movements_warehouse_type_date 
ON public.stock_movements(warehouse_id, movement_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movements_product_type_date 
ON public.stock_movements(product_id, movement_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movements_reference_type_id 
ON public.stock_movements(reference_type, reference_id) WHERE reference_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movements_performed_by_date 
ON public.stock_movements(performed_by, created_at DESC);

-- Indexes for transfer queries
CREATE INDEX IF NOT EXISTS idx_transfers_warehouses_status 
ON public.stock_transfers(source_warehouse_id, target_warehouse_id, status);

CREATE INDEX IF NOT EXISTS idx_transfers_status_date 
ON public.stock_transfers(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transfers_initiated_by_date 
ON public.stock_transfers(initiated_by, created_at DESC);

-- Indexes for transfer items
CREATE INDEX IF NOT EXISTS idx_transfer_items_product_status 
ON public.stock_transfer_items(product_id, status);

-- Indexes for receive logs
CREATE INDEX IF NOT EXISTS idx_receive_logs_warehouse_date 
ON public.receive_logs(warehouse_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_receive_logs_supplier_date 
ON public.receive_logs(supplier_id, created_at DESC) WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receive_logs_status_date 
ON public.receive_logs(status, created_at DESC);

-- Indexes for claim logs
CREATE INDEX IF NOT EXISTS idx_claim_logs_type_date 
ON public.claim_logs(claim_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claim_logs_processed_by_date 
ON public.claim_logs(processed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_claim_logs_resolution_date 
ON public.claim_logs(resolution, resolved_at DESC) WHERE resolution IS NOT NULL;

-- Indexes for stock adjustments
CREATE INDEX IF NOT EXISTS idx_adjustments_warehouse_type_date 
ON public.stock_adjustments(warehouse_id, adjustment_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adjustments_status_date 
ON public.stock_adjustments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_adjustments_performed_by_date 
ON public.stock_adjustments(performed_by, created_at DESC);

-- Partial indexes for active/available records (most common queries)
CREATE INDEX IF NOT EXISTS idx_serial_numbers_available 
ON public.product_serial_numbers(product_id, warehouse_id, created_at DESC) 
WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_serial_numbers_sold 
ON public.product_serial_numbers(product_id, warehouse_id, sold_at DESC) 
WHERE status = 'sold';

CREATE INDEX IF NOT EXISTS idx_transfers_pending 
ON public.stock_transfers(source_warehouse_id, target_warehouse_id, created_at DESC) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transfers_completed 
ON public.stock_transfers(source_warehouse_id, target_warehouse_id, confirmed_at DESC) 
WHERE status = 'delivered';

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_serial_numbers_search 
ON public.product_serial_numbers USING gin(to_tsvector('english', serial_number));

-- Indexes on related tables for joins
CREATE INDEX IF NOT EXISTS idx_products_active_name 
ON public.products(is_active, name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_category_brand 
ON public.products(category, brand) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_warehouses_active_type 
ON public.warehouses(status, type) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_suppliers_active_name 
ON public.suppliers(is_active, name) WHERE is_active = true;

-- Indexes for reporting and analytics (date-based indexes removed due to immutability issues)
-- Use regular timestamp indexes instead for date range queries

-- Covering indexes for common SELECT queries
CREATE INDEX IF NOT EXISTS idx_serial_numbers_covering 
ON public.product_serial_numbers(product_id, warehouse_id) 
INCLUDE (serial_number, status, unit_cost, created_at);

CREATE INDEX IF NOT EXISTS idx_movements_covering 
ON public.stock_movements(product_id, warehouse_id, created_at DESC) 
INCLUDE (movement_type, quantity, unit_cost, reference_type, reference_number);

-- Unique constraint indexes (if not already created by constraints)
CREATE UNIQUE INDEX IF NOT EXISTS idx_serial_numbers_unique 
ON public.product_serial_numbers(serial_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transfer_number_unique 
ON public.stock_transfers(transfer_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_receive_number_unique 
ON public.receive_logs(receive_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_claim_number_unique 
ON public.claim_logs(claim_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_adjustment_number_unique 
ON public.stock_adjustments(adjustment_number);

-- Indexes for foreign key constraints (if not automatically created)
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_fk 
ON public.product_serial_numbers(product_id);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_warehouse_fk 
ON public.product_serial_numbers(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_supplier_fk 
ON public.product_serial_numbers(supplier_id) WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movements_product_fk 
ON public.stock_movements(product_id);

CREATE INDEX IF NOT EXISTS idx_movements_warehouse_fk 
ON public.stock_movements(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_movements_serial_number_fk 
ON public.stock_movements(serial_number_id) WHERE serial_number_id IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE public.product_serial_numbers;
ANALYZE public.stock_movements;
ANALYZE public.stock_transfers;
ANALYZE public.stock_transfer_items;
ANALYZE public.receive_logs;
ANALYZE public.claim_logs;
ANALYZE public.stock_adjustments;
ANALYZE public.products;
ANALYZE public.warehouses;
ANALYZE public.suppliers;

-- Create statistics for better query planning
CREATE STATISTICS IF NOT EXISTS stats_serial_numbers_product_warehouse 
ON product_id, warehouse_id FROM public.product_serial_numbers;

CREATE STATISTICS IF NOT EXISTS stats_serial_numbers_status_date 
ON status, created_at FROM public.product_serial_numbers;

CREATE STATISTICS IF NOT EXISTS stats_movements_type_date 
ON movement_type, created_at FROM public.stock_movements;

CREATE STATISTICS IF NOT EXISTS stats_transfers_warehouses 
ON source_warehouse_id, target_warehouse_id FROM public.stock_transfers;

-- Comments for documentation
COMMENT ON INDEX idx_serial_numbers_product_warehouse_status IS 'Composite index for stock level queries by product, warehouse, and status';
COMMENT ON INDEX idx_movements_warehouse_type_date IS 'Index for movement history queries by warehouse and type';
COMMENT ON INDEX idx_transfers_warehouses_status IS 'Index for transfer queries between warehouses';
COMMENT ON INDEX idx_serial_numbers_available IS 'Partial index for available serial numbers (most common query)';
COMMENT ON INDEX idx_serial_numbers_search IS 'GIN index for full-text search on serial numbers';
