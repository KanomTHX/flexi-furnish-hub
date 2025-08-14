-- ========================================
-- ROLLBACK SCRIPT FOR SUPPLIER BILLING ADVANCED FEATURES
-- Use this script to rollback the advanced features migration
-- WARNING: This will delete all data in the advanced features tables
-- ========================================

-- ========================================
-- DROP MATERIALIZED VIEWS
-- ========================================

DROP MATERIALIZED VIEW IF EXISTS mv_supplier_performance_summary;

-- ========================================
-- DROP VIEWS
-- ========================================

DROP VIEW IF EXISTS supplier_performance_dashboard;
DROP VIEW IF EXISTS stock_alerts_summary;
DROP VIEW IF EXISTS notification_performance;

-- ========================================
-- DROP FUNCTIONS AND PROCEDURES
-- ========================================

DROP FUNCTION IF EXISTS generate_auto_purchase_order_number();
DROP FUNCTION IF EXISTS calculate_supplier_performance_metrics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS process_stock_alert(UUID);
DROP FUNCTION IF EXISTS cleanup_old_notification_history(INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_sync_logs(INTEGER);
DROP FUNCTION IF EXISTS cleanup_old_report_history(INTEGER);
DROP FUNCTION IF EXISTS get_supplier_dashboard_metrics(UUID);
DROP FUNCTION IF EXISTS get_notification_statistics(INTEGER);

-- ========================================
-- DROP TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS update_report_definitions_updated_at ON report_definitions;
DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON scheduled_reports;
DROP TRIGGER IF EXISTS update_auto_purchase_orders_updated_at ON auto_purchase_orders;
DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON supplier_products;
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
DROP TRIGGER IF EXISTS update_supplier_communication_preferences_updated_at ON supplier_communication_preferences;

-- ========================================
-- DROP TABLES (in reverse dependency order)
-- ========================================

-- Notification system tables
DROP TABLE IF EXISTS notification_history CASCADE;
DROP TABLE IF EXISTS scheduled_notifications CASCADE;
DROP TABLE IF EXISTS supplier_communication_preferences CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;

-- POS integration tables
DROP TABLE IF EXISTS auto_purchase_order_items CASCADE;
DROP TABLE IF EXISTS auto_purchase_orders CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS integration_sync_log CASCADE;

-- Reporting tables
DROP TABLE IF EXISTS report_execution_history CASCADE;
DROP TABLE IF EXISTS scheduled_reports CASCADE;
DROP TABLE IF EXISTS supplier_performance_metrics CASCADE;
DROP TABLE IF EXISTS report_definitions CASCADE;

-- ========================================
-- REMOVE COLUMNS ADDED TO EXISTING TABLES
-- ========================================

-- Remove columns added to journal_entries
ALTER TABLE journal_entries 
DROP COLUMN IF EXISTS transaction_date,
DROP COLUMN IF EXISTS source_type,
DROP COLUMN IF EXISTS source_id,
DROP COLUMN IF EXISTS posted_at;

-- Remove columns added to journal_entry_lines
ALTER TABLE journal_entry_lines 
DROP COLUMN IF EXISTS account_code,
DROP COLUMN IF EXISTS account_name,
DROP COLUMN IF EXISTS reference;

-- ========================================
-- DROP ENUMS
-- ========================================

DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;
DROP TYPE IF EXISTS integration_type CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;

-- ========================================
-- DROP SCHEDULED JOBS (if using pg_cron)
-- ========================================

-- Uncomment if you have pg_cron enabled and created these jobs
-- SELECT cron.unschedule('refresh-supplier-performance');
-- SELECT cron.unschedule('cleanup-old-logs');
-- SELECT cron.unschedule('calculate-performance-metrics');

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Supplier Billing Advanced Features rollback completed!';
    RAISE NOTICE 'All advanced features tables, views, functions, and triggers have been removed';
    RAISE NOTICE 'The database has been restored to the basic supplier billing state';
    RAISE NOTICE 'WARNING: All data in the advanced features tables has been permanently deleted';
END $$;