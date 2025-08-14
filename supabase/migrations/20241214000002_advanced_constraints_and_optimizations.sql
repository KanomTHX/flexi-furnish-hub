-- ========================================
-- ADVANCED CONSTRAINTS AND OPTIMIZATIONS
-- Additional constraints, foreign keys, and performance optimizations
-- for the supplier billing advanced features
-- ========================================

-- ========================================
-- ADDITIONAL FOREIGN KEY CONSTRAINTS
-- ========================================

-- Add foreign key constraints where external references exist
-- Note: These assume the existence of related tables in the system

-- Add constraints for user references (if users/employees table exists)
-- ALTER TABLE report_definitions ADD CONSTRAINT fk_report_definitions_created_by 
--     FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ALTER TABLE notification_templates ADD CONSTRAINT fk_notification_templates_created_by 
--     FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ALTER TABLE auto_purchase_orders ADD CONSTRAINT fk_auto_purchase_orders_created_by 
--     FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- ========================================
-- CHECK CONSTRAINTS FOR DATA INTEGRITY
-- ========================================

-- Ensure journal entries balance
ALTER TABLE journal_entries 
ADD CONSTRAINT chk_journal_entries_balance 
CHECK (total_debit = total_credit);

-- Ensure journal entry lines have either debit or credit (not both)
ALTER TABLE journal_entry_lines 
ADD CONSTRAINT chk_journal_entry_lines_debit_credit 
CHECK ((debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0));

-- Ensure stock alert quantities are positive
ALTER TABLE stock_alerts 
ADD CONSTRAINT chk_stock_alerts_positive_quantities 
CHECK (current_stock >= 0 AND reorder_point > 0 AND reorder_quantity > 0);

-- Ensure purchase order amounts are positive
ALTER TABLE auto_purchase_orders 
ADD CONSTRAINT chk_auto_purchase_orders_positive_amount 
CHECK (total_amount >= 0);

-- Ensure purchase order item quantities and costs are positive
ALTER TABLE auto_purchase_order_items 
ADD CONSTRAINT chk_auto_purchase_order_items_positive_values 
CHECK (quantity > 0 AND unit_cost >= 0 AND total_cost >= 0);

-- Ensure notification retry count is within limits
ALTER TABLE scheduled_notifications 
ADD CONSTRAINT chk_scheduled_notifications_retry_count 
CHECK (retry_count >= 0 AND retry_count <= max_retries);

-- Ensure performance metrics are within valid ranges
ALTER TABLE supplier_performance_metrics 
ADD CONSTRAINT chk_supplier_performance_metrics_ranges 
CHECK (
    total_spend >= 0 AND 
    invoice_count >= 0 AND 
    payment_count >= 0 AND 
    average_payment_days >= 0 AND
    on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100 AND
    quality_score >= 0 AND quality_score <= 10 AND
    reliability_score >= 0 AND reliability_score <= 10 AND
    cost_efficiency_rating >= 0 AND cost_efficiency_rating <= 10
);

-- Ensure supplier product relationships have valid values
ALTER TABLE supplier_products 
ADD CONSTRAINT chk_supplier_products_positive_values 
CHECK (
    unit_cost >= 0 AND 
    minimum_order_quantity > 0 AND 
    lead_time_days >= 0
);

-- ========================================
-- UNIQUE CONSTRAINTS FOR DATA CONSISTENCY
-- ========================================

-- Ensure unique report names per type
ALTER TABLE report_definitions 
ADD CONSTRAINT uq_report_definitions_name_type 
UNIQUE (name, type);

-- Ensure unique scheduled report names
ALTER TABLE scheduled_reports 
ADD CONSTRAINT uq_scheduled_reports_name 
UNIQUE (name);

-- Ensure unique notification template names per type
ALTER TABLE notification_templates 
ADD CONSTRAINT uq_notification_templates_name_type 
UNIQUE (name, type);

-- ========================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ========================================

-- Index for active reports only
CREATE INDEX IF NOT EXISTS idx_report_definitions_active_type 
ON report_definitions(type) WHERE is_active = true;

-- Index for pending stock alerts only
CREATE INDEX IF NOT EXISTS idx_stock_alerts_pending_urgency 
ON stock_alerts(urgency_level, created_at) WHERE status = 'pending';

-- Index for scheduled notifications that need to be sent
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_pending 
ON scheduled_notifications(scheduled_for) WHERE status = 'scheduled';

-- Index for failed notifications that can be retried
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_retry 
ON scheduled_notifications(scheduled_for, retry_count) 
WHERE status = 'failed' AND retry_count < max_retries;

-- Index for active supplier products only
CREATE INDEX IF NOT EXISTS idx_supplier_products_active 
ON supplier_products(supplier_id, product_id) WHERE is_active = true;

-- Index for preferred supplier products
CREATE INDEX IF NOT EXISTS idx_supplier_products_preferred 
ON supplier_products(product_id, supplier_id) WHERE is_preferred = true AND is_active = true;

-- ========================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ========================================

-- Composite index for supplier performance queries
CREATE INDEX IF NOT EXISTS idx_supplier_performance_metrics_composite 
ON supplier_performance_metrics(supplier_id, period_start DESC, period_end DESC);

-- Composite index for stock alert processing
CREATE INDEX IF NOT EXISTS idx_stock_alerts_processing 
ON stock_alerts(preferred_supplier_id, status, urgency_level, created_at);

-- Composite index for notification scheduling
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduling 
ON scheduled_notifications(type, status, scheduled_for);

-- Composite index for integration sync monitoring
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_monitoring 
ON integration_sync_log(integration_type, status, started_at DESC);

-- Composite index for report execution tracking
CREATE INDEX IF NOT EXISTS idx_report_execution_history_tracking 
ON report_execution_history(report_definition_id, status, execution_start DESC);

-- ========================================
-- ADVANCED STORED PROCEDURES
-- ========================================

-- Procedure to cleanup old notification history
CREATE OR REPLACE FUNCTION cleanup_old_notification_history(days_to_keep INTEGER DEFAULT 90) 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notification_history 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure to cleanup old integration sync logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs(days_to_keep INTEGER DEFAULT 30) 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM integration_sync_log 
    WHERE started_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure to cleanup old report execution history
CREATE OR REPLACE FUNCTION cleanup_old_report_history(days_to_keep INTEGER DEFAULT 180) 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM report_execution_history 
    WHERE execution_start < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get supplier dashboard metrics
CREATE OR REPLACE FUNCTION get_supplier_dashboard_metrics(supplier_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    total_suppliers INTEGER,
    total_outstanding DECIMAL(12,2),
    overdue_amount DECIMAL(12,2),
    pending_stock_alerts INTEGER,
    auto_pos_this_month INTEGER,
    avg_payment_days DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT s.id)::INTEGER as total_suppliers,
        COALESCE(SUM(s.current_balance), 0) as total_outstanding,
        COALESCE(SUM(CASE WHEN si.due_date < CURRENT_DATE AND si.remaining_amount > 0 THEN si.remaining_amount ELSE 0 END), 0) as overdue_amount,
        COUNT(DISTINCT sa.id)::INTEGER as pending_stock_alerts,
        COUNT(DISTINCT CASE WHEN apo.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN apo.id END)::INTEGER as auto_pos_this_month,
        COALESCE(AVG(spm.average_payment_days), 0) as avg_payment_days
    FROM suppliers s
    LEFT JOIN supplier_invoices si ON s.id = si.supplier_id
    LEFT JOIN stock_alerts sa ON s.id = sa.preferred_supplier_id AND sa.status = 'pending'
    LEFT JOIN auto_purchase_orders apo ON s.id = apo.supplier_id
    LEFT JOIN supplier_performance_metrics spm ON s.id = spm.supplier_id 
        AND spm.period_start = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    WHERE s.status = 'active'
        AND (supplier_id_param IS NULL OR s.id = supplier_id_param);
END;
$$ LANGUAGE plpgsql;

-- Function to get notification statistics
CREATE OR REPLACE FUNCTION get_notification_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    notification_type notification_type,
    total_sent INTEGER,
    total_failed INTEGER,
    success_rate DECIMAL(5,2),
    avg_retry_count DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sn.type as notification_type,
        COUNT(CASE WHEN sn.status = 'sent' THEN 1 END)::INTEGER as total_sent,
        COUNT(CASE WHEN sn.status = 'failed' THEN 1 END)::INTEGER as total_failed,
        CASE 
            WHEN COUNT(sn.id) > 0 THEN 
                ROUND(COUNT(CASE WHEN sn.status = 'sent' THEN 1 END) * 100.0 / COUNT(sn.id), 2)
            ELSE 0 
        END as success_rate,
        COALESCE(AVG(sn.retry_count), 0) as avg_retry_count
    FROM scheduled_notifications sn
    WHERE sn.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY sn.type
    ORDER BY sn.type;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ========================================

-- Materialized view for supplier performance summary (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_supplier_performance_summary AS
SELECT 
    s.id as supplier_id,
    s.supplier_name,
    s.supplier_code,
    s.current_balance,
    COUNT(DISTINCT si.id) as total_invoices_ytd,
    COALESCE(SUM(si.total_amount), 0) as total_spend_ytd,
    COALESCE(SUM(si.remaining_amount), 0) as outstanding_amount,
    COALESCE(SUM(CASE WHEN si.due_date < CURRENT_DATE AND si.remaining_amount > 0 THEN si.remaining_amount ELSE 0 END), 0) as overdue_amount,
    COALESCE(AVG(EXTRACT(DAY FROM (sp.payment_date - si.invoice_date))), 0) as avg_payment_days_ytd,
    COUNT(DISTINCT sa.id) as pending_stock_alerts,
    COUNT(DISTINCT apo.id) as auto_purchase_orders_ytd,
    MAX(si.invoice_date) as last_invoice_date,
    MAX(sp.payment_date) as last_payment_date
FROM suppliers s
LEFT JOIN supplier_invoices si ON s.id = si.supplier_id 
    AND si.invoice_date >= DATE_TRUNC('year', CURRENT_DATE)
LEFT JOIN supplier_payments sp ON si.id = sp.invoice_id
LEFT JOIN stock_alerts sa ON s.id = sa.preferred_supplier_id AND sa.status = 'pending'
LEFT JOIN auto_purchase_orders apo ON s.id = apo.supplier_id 
    AND apo.created_at >= DATE_TRUNC('year', CURRENT_DATE)
WHERE s.status = 'active'
GROUP BY s.id, s.supplier_name, s.supplier_code, s.current_balance;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_supplier_performance_summary_supplier_id 
ON mv_supplier_performance_summary(supplier_id);

-- ========================================
-- SCHEDULED JOBS (Using pg_cron if available)
-- ========================================

-- Note: These would require pg_cron extension to be enabled
-- Uncomment and modify as needed for your environment

-- Schedule daily refresh of materialized view
-- SELECT cron.schedule('refresh-supplier-performance', '0 1 * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_supplier_performance_summary;');

-- Schedule weekly cleanup of old logs
-- SELECT cron.schedule('cleanup-old-logs', '0 2 * * 0', 'SELECT cleanup_old_notification_history(90); SELECT cleanup_old_sync_logs(30); SELECT cleanup_old_report_history(180);');

-- Schedule daily calculation of supplier performance metrics
-- SELECT cron.schedule('calculate-performance-metrics', '0 3 * * *', 
--     'SELECT calculate_supplier_performance_metrics(id, DATE_TRUNC(''month'', CURRENT_DATE - INTERVAL ''1 month''), DATE_TRUNC(''month'', CURRENT_DATE) - INTERVAL ''1 day'') FROM suppliers WHERE status = ''active'';');

-- ========================================
-- SECURITY POLICIES (Row Level Security)
-- ========================================

-- Enable RLS on sensitive tables
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your authentication system)
-- CREATE POLICY "Users can view their own reports" ON report_definitions
--     FOR SELECT USING (created_by = auth.uid());

-- CREATE POLICY "Users can manage their own notification templates" ON notification_templates
--     FOR ALL USING (created_by = auth.uid());

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Advanced constraints and optimizations applied successfully!';
    RAISE NOTICE 'Added check constraints for data integrity';
    RAISE NOTICE 'Created partial and composite indexes for performance';
    RAISE NOTICE 'Added cleanup procedures for maintenance';
    RAISE NOTICE 'Created materialized view for performance optimization';
    RAISE NOTICE 'Applied security policies (RLS enabled)';
    RAISE NOTICE 'Database schema is now ready for advanced supplier billing features';
END $$;