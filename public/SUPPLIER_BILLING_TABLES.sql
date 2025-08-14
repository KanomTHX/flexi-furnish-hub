-- ========================================
-- SUPPLIER BILLING SYSTEM TABLES
-- เฉพาะส่วนที่เกี่ยวข้องกับ Supplier Billing
-- ========================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- ENUMS (ถ้ายังไม่มี)
-- ========================================

-- Payment status (ถ้ายังไม่มี)
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending', 
        'paid', 
        'overdue', 
        'cancelled', 
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- SUPPLIER BILLING TABLES
-- ========================================

-- 1. Suppliers (ซัพพลายเออร์)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_code VARCHAR(20) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(20),
    payment_terms INTEGER DEFAULT 30, -- วันที่ต้องชำระ
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Supplier Invoices (ใบแจ้งหนี้จากซัพพลายเออร์)
CREATE TABLE IF NOT EXISTS supplier_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    purchase_order_id UUID, -- อ้างอิงถึง purchase_orders (ถ้ามี)
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status payment_status DEFAULT 'pending',
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    created_by UUID, -- อ้างอิงถึง employees (ถ้ามี)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Supplier Invoice Items (รายการสินค้าในใบแจ้งหนี้)
CREATE TABLE IF NOT EXISTS supplier_invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    product_id UUID, -- อ้างอิงถึง products (ถ้ามี)
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Supplier Payments (การชำระเงินให้ซัพพลายเออร์)
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    invoice_id UUID REFERENCES supplier_invoices(id),
    payment_date DATE NOT NULL,
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID, -- อ้างอิงถึง employees (ถ้ามี)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ACCOUNTING INTEGRATION TABLES
-- ========================================

-- 5. Chart of Accounts (ผังบัญชี) - ถ้ายังไม่มี
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(100),
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Journal Entries (รายการบัญชี)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50), -- 'supplier_invoice', 'supplier_payment', etc.
    reference_id UUID,
    reference_number VARCHAR(100),
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
    created_by UUID, -- อ้างอิงถึง employees (ถ้ามี)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Journal Entry Lines (รายการย่อยของบัญชี)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(12,2) DEFAULT 0,
    credit_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STORED PROCEDURES AND FUNCTIONS
-- ========================================

-- Function to update supplier balance
CREATE OR REPLACE FUNCTION update_supplier_balance(
    supplier_id UUID,
    amount DECIMAL(12,2)
) RETURNS VOID AS $$
BEGIN
    UPDATE suppliers 
    SET 
        current_balance = current_balance + amount,
        updated_at = NOW()
    WHERE id = supplier_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate supplier code
CREATE OR REPLACE FUNCTION generate_supplier_code() RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(supplier_code FROM 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM suppliers
    WHERE supplier_code ~ '^SUP[0-9]+$';
    
    -- Format as SUP001, SUP002, etc.
    new_code := 'SUP' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    year_month TEXT;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(year_month) + 5) AS INTEGER)), 0) + 1
    INTO counter
    FROM supplier_invoices
    WHERE invoice_number ~ ('^INV' || year_month || '[0-9]+$');
    
    -- Format as INV202412001, INV202412002, etc.
    new_number := 'INV' || year_month || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    year_month TEXT;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(payment_number FROM LENGTH(year_month) + 5) AS INTEGER)), 0) + 1
    INTO counter
    FROM supplier_payments
    WHERE payment_number ~ ('^PAY' || year_month || '[0-9]+$');
    
    -- Format as PAY202412001, PAY202412002, etc.
    new_number := 'PAY' || year_month || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate journal entry number
CREATE OR REPLACE FUNCTION generate_journal_entry_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
    year_month TEXT;
BEGIN
    -- Get current year and month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM LENGTH(year_month) + 4) AS INTEGER)), 0) + 1
    INTO counter
    FROM journal_entries
    WHERE entry_number ~ ('^JE' || year_month || '[0-9]+$');
    
    -- Format as JE202412001, JE202412002, etc.
    new_number := 'JE' || year_month || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get supplier monthly trends
CREATE OR REPLACE FUNCTION get_supplier_monthly_trends(supplier_id_param UUID DEFAULT NULL)
RETURNS TABLE (
    month_year TEXT,
    total_invoices INTEGER,
    total_amount DECIMAL(12,2),
    paid_amount DECIMAL(12,2),
    outstanding_amount DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(si.invoice_date, 'YYYY-MM') as month_year,
        COUNT(si.id)::INTEGER as total_invoices,
        COALESCE(SUM(si.total_amount), 0) as total_amount,
        COALESCE(SUM(si.paid_amount), 0) as paid_amount,
        COALESCE(SUM(si.remaining_amount), 0) as outstanding_amount
    FROM supplier_invoices si
    WHERE (supplier_id_param IS NULL OR si.supplier_id = supplier_id_param)
        AND si.invoice_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY TO_CHAR(si.invoice_date, 'YYYY-MM')
    ORDER BY month_year DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VIEWS
-- ========================================

-- View for supplier billing summary
CREATE OR REPLACE VIEW supplier_billing_summary AS
SELECT 
    s.id as supplier_id,
    s.supplier_name,
    s.supplier_code,
    s.current_balance,
    COUNT(si.id) as total_invoices,
    COALESCE(SUM(si.total_amount), 0) as total_amount,
    COALESCE(SUM(si.paid_amount), 0) as paid_amount,
    COALESCE(SUM(si.remaining_amount), 0) as outstanding_amount,
    COALESCE(SUM(CASE WHEN si.due_date < CURRENT_DATE AND si.remaining_amount > 0 THEN si.remaining_amount ELSE 0 END), 0) as overdue_amount,
    MAX(sp.payment_date) as last_payment_date,
    COALESCE(AVG(EXTRACT(DAY FROM (sp.payment_date - si.invoice_date))), 0) as average_payment_days
FROM suppliers s
LEFT JOIN supplier_invoices si ON s.id = si.supplier_id
LEFT JOIN supplier_payments sp ON si.id = sp.invoice_id
WHERE s.status = 'active'
GROUP BY s.id, s.supplier_name, s.supplier_code, s.current_balance;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- Supplier Invoices
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_invoice_number ON supplier_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_invoice_date ON supplier_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_due_date ON supplier_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON supplier_invoices(status);

-- Supplier Payments
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON supplier_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON supplier_payments(payment_date);

-- Journal Entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_number ON journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference_type ON journal_entries(reference_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference_id ON journal_entries(reference_id);

-- Chart of Accounts
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);

-- ========================================
-- SAMPLE DATA (OPTIONAL)
-- ========================================

-- Insert basic chart of accounts for supplier billing
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category) VALUES
    ('1100', 'Cash', 'asset', 'current_assets'),
    ('1200', 'Bank Account', 'asset', 'current_assets'),
    ('1300', 'Inventory', 'asset', 'current_assets'),
    ('1400', 'VAT Input', 'asset', 'current_assets'),
    ('2100', 'Accounts Payable', 'liability', 'current_liabilities'),
    ('2200', 'GRNI (Goods Received Not Invoiced)', 'liability', 'current_liabilities'),
    ('5100', 'Cost of Goods Sold', 'expense', 'operating_expenses'),
    ('5200', 'Purchase Expenses', 'expense', 'operating_expenses')
ON CONFLICT (account_code) DO NOTHING;

-- ========================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_invoices_updated_at ON supplier_invoices;
CREATE TRIGGER update_supplier_invoices_updated_at
    BEFORE UPDATE ON supplier_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chart_of_accounts_updated_at ON chart_of_accounts;
CREATE TRIGGER update_chart_of_accounts_updated_at
    BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE 'Supplier Billing System tables created successfully!';
    RAISE NOTICE 'Tables created: suppliers, supplier_invoices, supplier_invoice_items, supplier_payments';
    RAISE NOTICE 'Accounting tables: chart_of_accounts, journal_entries, journal_entry_lines';
    RAISE NOTICE 'Functions created: generate_supplier_code, generate_invoice_number, generate_payment_number, etc.';
    RAISE NOTICE 'Views created: supplier_billing_summary';
    RAISE NOTICE 'Indexes and triggers applied for performance and data integrity';
END $$;