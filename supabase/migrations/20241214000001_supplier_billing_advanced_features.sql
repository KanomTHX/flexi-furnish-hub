-- ========================================
-- SUPPLIER BILLING ADVANCED FEATURES MIGRATION
-- Migration for advanced features including:
-- - Extended accounting integration
-- - Advanced reporting system
-- - POS integration
-- - Automated notifications
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- ENUMS FOR ADVANCED FEATURES
-- ========================================

-- Notification types
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'payment_reminder',
        'overdue_notice',
        'monthly_statement',
        'custom_reminder',
        'system_alert'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report types
DO $$ BEGIN
    CREATE TYPE report_type AS ENUM (
        'supplier_performance',
        'spending_analysis',
        'aging_report',
        'cash_flow_projection',
        'supplier_comparison',
        'custom_report'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Integration types
DO $$ BEGIN
    CREATE TYPE integration_type AS ENUM (
        'pos_system',
        'accounting_system',
        'banking_system',
        'email_service'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Stock alert urgency levels
DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM (
        'low',
        'medium',
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- EXTENDED ACCOUNTING INTEGRATION TABLES
-- ========================================

-- Update existing journal_entries table with additional fields
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS transaction_date DATE,
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_id UUID,
ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP WITH TIME ZONE;

-- Update existing journal_entry_lines table with additional fields
ALTER TABLE journal_entry_lines 
ADD COLUMN IF NOT EXISTS account_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference VARCHAR(100);

-- ========================================
-- REPORTING AND ANALYTICS TABLES
-- ========================================

-- Report definitions for dynamic report generation
CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type report_type NOT NULL,
    description TEXT,
    sql_query TEXT,
    parameters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled reports for automation
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_definition_id UUID REFERENCES report_definitions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schedule_cron VARCHAR(100) NOT NULL,
    recipients TEXT[] DEFAULT '{}',
    parameters JSONB DEFAULT '{}',
    export_format VARCHAR(20) DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'excel', 'csv')),
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier performance metrics for analytics
CREATE TABLE IF NOT EXISTS supplier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spend DECIMAL(12,2) DEFAULT 0,
    invoice_count INTEGER DEFAULT 0,
    payment_count INTEGER DEFAULT 0,
    average_payment_days DECIMAL(5,2) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0,
    reliability_score DECIMAL(3,2) DEFAULT 0,
    cost_efficiency_rating DECIMAL(3,2) DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, period_start, period_end)
);

-- Report execution history
CREATE TABLE IF NOT EXISTS report_execution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_definition_id UUID REFERENCES report_definitions(id),
    scheduled_report_id UUID REFERENCES scheduled_reports(id),
    execution_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_end TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    records_processed INTEGER DEFAULT 0,
    file_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- POS INTEGRATION TABLES
-- ========================================

-- Stock alerts from POS system
CREATE TABLE IF NOT EXISTS stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(50),
    current_stock INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,
    preferred_supplier_id UUID REFERENCES suppliers(id),
    urgency_level urgency_level DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automatic purchase orders generated from stock alerts
CREATE TABLE IF NOT EXISTS auto_purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'delivered', 'cancelled')),
    automation_reason TEXT,
    stock_alert_id UUID REFERENCES stock_alerts(id),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto purchase order items
CREATE TABLE IF NOT EXISTS auto_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES auto_purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration sync log for monitoring
CREATE TABLE IF NOT EXISTS integration_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_type integration_type NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '{}',
    sync_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Supplier product relationships for POS integration
CREATE TABLE IF NOT EXISTS supplier_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_code VARCHAR(50),
    supplier_product_code VARCHAR(50),
    unit_cost DECIMAL(10,2),
    minimum_order_quantity INTEGER DEFAULT 1,
    lead_time_days INTEGER DEFAULT 7,
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- ========================================
-- NOTIFICATION SYSTEM TABLES
-- ========================================

-- Notification templates for customizable messages
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type notification_type NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled notifications for automation
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type notification_type NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    content TEXT,
    html_content TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    template_id UUID REFERENCES notification_templates(id),
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history for tracking and analytics
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES scheduled_notifications(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    delivery_attempt INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication preferences per supplier
CREATE TABLE IF NOT EXISTS supplier_communication_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    email_reminders BOOLEAN DEFAULT true,
    sms_reminders BOOLEAN DEFAULT false,
    reminder_days_before INTEGER[] DEFAULT '{7,3,1}',
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'both')),
    language_preference VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id)
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Report definitions indexes
CREATE INDEX IF NOT EXISTS idx_report_definitions_type ON report_definitions(type);
CREATE INDEX IF NOT EXISTS idx_report_definitions_active ON report_definitions(is_active);

-- Scheduled reports indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);

-- Supplier performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier_id ON supplier_performance_metrics(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_period ON supplier_performance_metrics(period_start, period_end);

-- Stock alerts indexes
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product_id ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_supplier_id ON stock_alerts(preferred_supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_status ON stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_urgency ON stock_alerts(urgency_level);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created_at ON stock_alerts(created_at);

-- Auto purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_auto_purchase_orders_supplier_id ON auto_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_auto_purchase_orders_status ON auto_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_auto_purchase_orders_order_number ON auto_purchase_orders(order_number);

-- Integration sync log indexes
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_type ON integration_sync_log(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_status ON integration_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_started_at ON integration_sync_log(started_at);

-- Supplier products indexes
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_preferred ON supplier_products(is_preferred);

-- Notification templates indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Scheduled notifications indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_type ON scheduled_notifications(type);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_recipient ON scheduled_notifications(recipient_email);

-- Notification history indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_notification_id ON notification_history(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON notification_history(created_at);

-- ========================================
-- STORED FUNCTIONS FOR ADVANCED FEATURES
-- ========================================

-- Function to generate auto purchase order number
CREATE OR REPLACE FUNCTION generate_auto_purchase_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    year_month TEXT;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(year_month) + 5) AS INTEGER)), 0) + 1
    INTO counter
    FROM auto_purchase_orders
    WHERE order_number ~ ('^APO' || year_month || '[0-9]+$');
    
    -- Format as APO202412001, APO202412002, etc.
    new_number := 'APO' || year_month || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate supplier performance metrics
CREATE OR REPLACE FUNCTION calculate_supplier_performance_metrics(
    supplier_id_param UUID,
    period_start_param DATE,
    period_end_param DATE
) RETURNS VOID AS $$
DECLARE
    total_spend_val DECIMAL(12,2);
    invoice_count_val INTEGER;
    payment_count_val INTEGER;
    avg_payment_days_val DECIMAL(5,2);
BEGIN
    -- Calculate metrics
    SELECT 
        COALESCE(SUM(si.total_amount), 0),
        COUNT(si.id),
        COUNT(sp.id),
        COALESCE(AVG(EXTRACT(DAY FROM (sp.payment_date - si.invoice_date))), 0)
    INTO 
        total_spend_val,
        invoice_count_val,
        payment_count_val,
        avg_payment_days_val
    FROM supplier_invoices si
    LEFT JOIN supplier_payments sp ON si.id = sp.invoice_id
    WHERE si.supplier_id = supplier_id_param
        AND si.invoice_date BETWEEN period_start_param AND period_end_param;
    
    -- Insert or update metrics
    INSERT INTO supplier_performance_metrics (
        supplier_id,
        period_start,
        period_end,
        total_spend,
        invoice_count,
        payment_count,
        average_payment_days,
        calculated_at
    ) VALUES (
        supplier_id_param,
        period_start_param,
        period_end_param,
        total_spend_val,
        invoice_count_val,
        payment_count_val,
        avg_payment_days_val,
        NOW()
    )
    ON CONFLICT (supplier_id, period_start, period_end)
    DO UPDATE SET
        total_spend = EXCLUDED.total_spend,
        invoice_count = EXCLUDED.invoice_count,
        payment_count = EXCLUDED.payment_count,
        average_payment_days = EXCLUDED.average_payment_days,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to process stock alerts and create purchase orders
CREATE OR REPLACE FUNCTION process_stock_alert(alert_id UUID) RETURNS UUID AS $$
DECLARE
    alert_record stock_alerts%ROWTYPE;
    po_id UUID;
    po_number TEXT;
BEGIN
    -- Get alert details
    SELECT * INTO alert_record FROM stock_alerts WHERE id = alert_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock alert not found: %', alert_id;
    END IF;
    
    -- Generate PO number
    po_number := generate_auto_purchase_order_number();
    
    -- Create auto purchase order
    INSERT INTO auto_purchase_orders (
        order_number,
        supplier_id,
        total_amount,
        expected_delivery_date,
        automation_reason,
        stock_alert_id
    ) VALUES (
        po_number,
        alert_record.preferred_supplier_id,
        0, -- Will be calculated when items are added
        CURRENT_DATE + INTERVAL '7 days',
        'Automatic PO generated from stock alert',
        alert_id
    ) RETURNING id INTO po_id;
    
    -- Update alert status
    UPDATE stock_alerts 
    SET status = 'processing', processed_at = NOW()
    WHERE id = alert_id;
    
    RETURN po_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ========================================

-- Apply update triggers to new tables
DROP TRIGGER IF EXISTS update_report_definitions_updated_at ON report_definitions;
CREATE TRIGGER update_report_definitions_updated_at
    BEFORE UPDATE ON report_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auto_purchase_orders_updated_at ON auto_purchase_orders;
CREATE TRIGGER update_auto_purchase_orders_updated_at
    BEFORE UPDATE ON auto_purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON supplier_products;
CREATE TRIGGER update_supplier_products_updated_at
    BEFORE UPDATE ON supplier_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_communication_preferences_updated_at ON supplier_communication_preferences;
CREATE TRIGGER update_supplier_communication_preferences_updated_at
    BEFORE UPDATE ON supplier_communication_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR ADVANCED FEATURES
-- ========================================

-- Enhanced supplier performance view
CREATE OR REPLACE VIEW supplier_performance_dashboard AS
SELECT 
    s.id as supplier_id,
    s.supplier_name,
    s.supplier_code,
    s.current_balance,
    spm.total_spend,
    spm.invoice_count,
    spm.average_payment_days,
    spm.reliability_score,
    COUNT(sa.id) as pending_stock_alerts,
    COUNT(apo.id) as auto_purchase_orders,
    COALESCE(SUM(CASE WHEN si.due_date < CURRENT_DATE AND si.remaining_amount > 0 THEN si.remaining_amount ELSE 0 END), 0) as overdue_amount
FROM suppliers s
LEFT JOIN supplier_performance_metrics spm ON s.id = spm.supplier_id 
    AND spm.period_start = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
LEFT JOIN stock_alerts sa ON s.id = sa.preferred_supplier_id AND sa.status = 'pending'
LEFT JOIN auto_purchase_orders apo ON s.id = apo.supplier_id AND apo.status IN ('draft', 'sent')
LEFT JOIN supplier_invoices si ON s.id = si.supplier_id
WHERE s.status = 'active'
GROUP BY s.id, s.supplier_name, s.supplier_code, s.current_balance, 
         spm.total_spend, spm.invoice_count, spm.average_payment_days, spm.reliability_score;

-- Stock alerts summary view
CREATE OR REPLACE VIEW stock_alerts_summary AS
SELECT 
    sa.urgency_level,
    COUNT(*) as alert_count,
    COUNT(CASE WHEN sa.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN sa.status = 'processing' THEN 1 END) as processing_count,
    AVG(sa.current_stock) as avg_current_stock,
    AVG(sa.reorder_point) as avg_reorder_point
FROM stock_alerts sa
WHERE sa.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sa.urgency_level;

-- Notification performance view
CREATE OR REPLACE VIEW notification_performance AS
SELECT 
    nt.type,
    COUNT(sn.id) as total_notifications,
    COUNT(CASE WHEN sn.status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN sn.status = 'failed' THEN 1 END) as failed_count,
    ROUND(COUNT(CASE WHEN sn.status = 'sent' THEN 1 END) * 100.0 / COUNT(sn.id), 2) as success_rate
FROM notification_templates nt
LEFT JOIN scheduled_notifications sn ON nt.id = sn.template_id
WHERE sn.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY nt.type;

-- ========================================
-- SAMPLE DATA FOR ADVANCED FEATURES
-- ========================================

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject, html_content, text_content, variables) VALUES
    ('Payment Reminder - 7 Days', 'payment_reminder', 'Payment Reminder: Invoice {{invoice_number}} Due in 7 Days', 
     '<p>Dear {{supplier_name}},</p><p>This is a friendly reminder that invoice {{invoice_number}} for {{total_amount}} is due on {{due_date}}.</p>', 
     'Dear {{supplier_name}}, This is a friendly reminder that invoice {{invoice_number}} for {{total_amount}} is due on {{due_date}}.', 
     '["supplier_name", "invoice_number", "total_amount", "due_date"]'::jsonb),
    ('Payment Reminder - 3 Days', 'payment_reminder', 'Urgent: Invoice {{invoice_number}} Due in 3 Days', 
     '<p>Dear {{supplier_name}},</p><p>Invoice {{invoice_number}} for {{total_amount}} is due in 3 days on {{due_date}}.</p>', 
     'Dear {{supplier_name}}, Invoice {{invoice_number}} for {{total_amount}} is due in 3 days on {{due_date}}.', 
     '["supplier_name", "invoice_number", "total_amount", "due_date"]'::jsonb),
    ('Overdue Notice', 'overdue_notice', 'Overdue Payment: Invoice {{invoice_number}}', 
     '<p>Dear {{supplier_name}},</p><p>Invoice {{invoice_number}} for {{total_amount}} was due on {{due_date}} and is now overdue.</p>', 
     'Dear {{supplier_name}}, Invoice {{invoice_number}} for {{total_amount}} was due on {{due_date}} and is now overdue.', 
     '["supplier_name", "invoice_number", "total_amount", "due_date"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert sample report definitions
INSERT INTO report_definitions (name, type, description, sql_query, parameters) VALUES
    ('Monthly Supplier Performance', 'supplier_performance', 'Monthly performance metrics for all suppliers',
     'SELECT * FROM supplier_performance_metrics WHERE period_start >= $1 AND period_end <= $2',
     '{"period_start": "date", "period_end": "date"}'::jsonb),
    ('Aging Report', 'aging_report', 'Outstanding invoices by aging periods',
     'SELECT supplier_name, SUM(CASE WHEN days_overdue <= 30 THEN remaining_amount ELSE 0 END) as current_30, SUM(CASE WHEN days_overdue BETWEEN 31 AND 60 THEN remaining_amount ELSE 0 END) as days_31_60 FROM supplier_invoices_aging WHERE remaining_amount > 0 GROUP BY supplier_name',
     '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Supplier Billing Advanced Features migration completed successfully!';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '- Reporting: report_definitions, scheduled_reports, supplier_performance_metrics, report_execution_history';
    RAISE NOTICE '- POS Integration: stock_alerts, auto_purchase_orders, auto_purchase_order_items, integration_sync_log, supplier_products';
    RAISE NOTICE '- Notifications: notification_templates, scheduled_notifications, notification_history, supplier_communication_preferences';
    RAISE NOTICE 'Enhanced views: supplier_performance_dashboard, stock_alerts_summary, notification_performance';
    RAISE NOTICE 'New functions: generate_auto_purchase_order_number, calculate_supplier_performance_metrics, process_stock_alert';
    RAISE NOTICE 'Performance indexes and triggers applied';
    RAISE NOTICE 'Sample data inserted for templates and report definitions';
END $$;