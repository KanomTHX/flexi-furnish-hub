-- Extended Accounting System Migration
-- Created: 2025-08-15
-- Purpose: Create extended accounting tables for comprehensive financial management

-- Create additional ENUM types for extended accounting
CREATE TYPE invoice_type AS ENUM ('ap_invoice', 'ar_invoice', 'credit_note', 'debit_note');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'approved', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'check', 'credit_card', 'promissory_note');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE expense_category AS ENUM ('rent', 'utilities', 'salary', 'marketing', 'office_supplies', 'travel', 'maintenance', 'insurance', 'other');
CREATE TYPE tax_type AS ENUM ('vat', 'withholding_tax', 'corporate_tax', 'other');
CREATE TYPE report_type AS ENUM ('profit_loss', 'balance_sheet', 'cash_flow', 'trial_balance', 'tax_report');
CREATE TYPE report_status AS ENUM ('generating', 'completed', 'failed');

-- ========================================
-- INVOICE MANAGEMENT TABLES
-- ========================================

-- AP Invoices (Accounts Payable - ใบวางบิล)
CREATE TABLE public.ap_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference_number TEXT,
  grn_number TEXT, -- Goods Receive Note
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status invoice_status DEFAULT 'draft',
  payment_terms TEXT,
  notes TEXT,
  attachments TEXT[],
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AR Invoices (Accounts Receivable - ใบแจ้งหนี้)
CREATE TABLE public.ar_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID,
  installment_contract_id UUID,
  branch_id UUID REFERENCES public.branches(id),
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  reference_number TEXT,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status invoice_status DEFAULT 'draft',
  payment_terms TEXT,
  notes TEXT,
  attachments TEXT[],
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL,
  invoice_type invoice_type NOT NULL,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- PAYMENT MANAGEMENT TABLES
-- ========================================

-- Invoice Payments
CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL,
  invoice_type invoice_type NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number TEXT,
  bank_account TEXT,
  notes TEXT,
  status payment_status DEFAULT 'pending',
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- EXPENSE MANAGEMENT TABLES
-- ========================================

-- Accounting Expenses
CREATE TABLE public.accounting_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number TEXT NOT NULL UNIQUE,
  branch_id UUID REFERENCES public.branches(id),
  category expense_category NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method payment_method,
  reference_number TEXT,
  vendor_name TEXT,
  account_id UUID REFERENCES public.accounts(id),
  attachments TEXT[],
  notes TEXT,
  created_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expense Categories
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  account_id UUID REFERENCES public.accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- TAX MANAGEMENT TABLES
-- ========================================

-- Tax Transactions
CREATE TABLE public.tax_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'sale', 'purchase', 'expense'
  tax_type tax_type NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL,
  taxable_amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  transaction_date DATE NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  vendor_tax_id TEXT,
  customer_tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- FINANCIAL REPORTS TABLES
-- ========================================

-- Financial Reports
CREATE TABLE public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  report_type report_type NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  data JSONB NOT NULL,
  status report_status DEFAULT 'generating',
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- INTEGRATION TABLES
-- ========================================

-- POS Integration
CREATE TABLE public.pos_accounting_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pos_transaction_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  revenue_amount NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  branch_id UUID REFERENCES public.branches(id),
  transaction_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Installment Integration
CREATE TABLE public.installment_accounting_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_payment_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  principal_amount NUMERIC(15,2) NOT NULL,
  interest_amount NUMERIC(15,2) NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  payment_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Supplier Integration
CREATE TABLE public.supplier_accounting_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_transaction_id UUID NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  transaction_type TEXT NOT NULL, -- 'purchase', 'payment', 'return'
  amount NUMERIC(15,2) NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  transaction_date DATE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- AP Invoices indexes
CREATE INDEX idx_ap_invoices_supplier_id ON public.ap_invoices(supplier_id);
CREATE INDEX idx_ap_invoices_branch_id ON public.ap_invoices(branch_id);
CREATE INDEX idx_ap_invoices_status ON public.ap_invoices(status);
CREATE INDEX idx_ap_invoices_due_date ON public.ap_invoices(due_date);
CREATE INDEX idx_ap_invoices_invoice_date ON public.ap_invoices(invoice_date);

-- AR Invoices indexes
CREATE INDEX idx_ar_invoices_customer_id ON public.ar_invoices(customer_id);
CREATE INDEX idx_ar_invoices_contract_id ON public.ar_invoices(installment_contract_id);
CREATE INDEX idx_ar_invoices_branch_id ON public.ar_invoices(branch_id);
CREATE INDEX idx_ar_invoices_status ON public.ar_invoices(status);
CREATE INDEX idx_ar_invoices_due_date ON public.ar_invoices(due_date);

-- Invoice Line Items indexes
CREATE INDEX idx_invoice_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_product_id ON public.invoice_line_items(product_id);

-- Payments indexes
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_payment_date ON public.invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_status ON public.invoice_payments(status);

-- Expenses indexes
CREATE INDEX idx_accounting_expenses_branch_id ON public.accounting_expenses(branch_id);
CREATE INDEX idx_accounting_expenses_category ON public.accounting_expenses(category);
CREATE INDEX idx_accounting_expenses_expense_date ON public.accounting_expenses(expense_date);
CREATE INDEX idx_accounting_expenses_account_id ON public.accounting_expenses(account_id);

-- Tax transactions indexes
CREATE INDEX idx_tax_transactions_transaction_date ON public.tax_transactions(transaction_date);
CREATE INDEX idx_tax_transactions_branch_id ON public.tax_transactions(branch_id);
CREATE INDEX idx_tax_transactions_tax_type ON public.tax_transactions(tax_type);

-- Financial reports indexes
CREATE INDEX idx_financial_reports_report_type ON public.financial_reports(report_type);
CREATE INDEX idx_financial_reports_branch_id ON public.financial_reports(branch_id);
CREATE INDEX idx_financial_reports_period ON public.financial_reports(period_start, period_end);

-- Integration indexes
CREATE INDEX idx_pos_integration_transaction_id ON public.pos_accounting_integration(pos_transaction_id);
CREATE INDEX idx_pos_integration_branch_id ON public.pos_accounting_integration(branch_id);
CREATE INDEX idx_installment_integration_payment_id ON public.installment_accounting_integration(installment_payment_id);
CREATE INDEX idx_supplier_integration_transaction_id ON public.supplier_accounting_integration(supplier_transaction_id);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_ap_invoices_updated_at BEFORE UPDATE ON public.ap_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ar_invoices_updated_at BEFORE UPDATE ON public.ar_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_payments_updated_at BEFORE UPDATE ON public.invoice_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounting_expenses_updated_at BEFORE UPDATE ON public.accounting_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert sample expense categories
INSERT INTO public.expense_categories (name, description) VALUES
('เช่าสำนักงาน', 'ค่าเช่าสำนักงานและพื้นที่ขาย'),
('ค่าน้ำค่าไฟ', 'ค่าสาธารณูปโภค'),
('เงินเดือน', 'เงินเดือนพนักงาน'),
('การตลาด', 'ค่าใช้จ่ายด้านการตลาดและโฆษณา'),
('อุปกรณ์สำนักงาน', 'เครื่องเขียนและอุปกรณ์สำนักงาน'),
('ค่าเดินทาง', 'ค่าใช้จ่ายในการเดินทาง'),
('ค่าบำรุงรักษา', 'ค่าซ่อมแซมและบำรุงรักษา'),
('ค่าประกันภัย', 'ค่าเบี้ยประกันภัยต่างๆ');

-- Insert sample chart of accounts for extended accounting
INSERT INTO public.accounts (code, name, type, category, description) VALUES
-- Assets
('1100', 'เงินสด', 'asset', 'current_asset', 'เงินสดในมือ'),
('1200', 'เงินฝากธนาคาร', 'asset', 'current_asset', 'เงินฝากธนาคารกระแสรายวัน'),
('1300', 'ลูกหนี้การค้า', 'asset', 'current_asset', 'ลูกหนี้จากการขายสินค้า'),
('1400', 'สินค้าคงเหลือ', 'asset', 'current_asset', 'มูลค่าสินค้าคงเหลือ'),
('1500', 'อุปกรณ์สำนักงาน', 'asset', 'fixed_asset', 'อุปกรณ์และเครื่องใช้สำนักงาน'),

-- Liabilities
('2100', 'เจ้าหนี้การค้า', 'liability', 'current_liability', 'เจ้าหนี้จากการซื้อสินค้า'),
('2200', 'ภาษีขายค้างจ่าย', 'liability', 'current_liability', 'ภาษีมูลค่าเพิ่มค้างจ่าย'),
('2300', 'ภาษีหัก ณ ที่จ่ายค้างจ่าย', 'liability', 'current_liability', 'ภาษีหัก ณ ที่จ่ายค้างจ่าย'),

-- Revenue
('4100', 'รายได้จากการขาย', 'revenue', 'sales_revenue', 'รายได้จากการขายสินค้า'),
('4200', 'รายได้ดอกเบี้ย', 'revenue', 'other_revenue', 'รายได้ดอกเบี้ยจากเช่าซื้อ'),

-- Expenses
('5100', 'ต้นทุนขาย', 'expense', 'cost_of_goods_sold', 'ต้นทุนสินค้าที่ขาย'),
('6100', 'ค่าเช่า', 'expense', 'operating_expense', 'ค่าเช่าสำนักงาน'),
('6200', 'ค่าน้ำค่าไฟ', 'expense', 'operating_expense', 'ค่าสาธารณูปโภค'),
('6300', 'เงินเดือน', 'expense', 'operating_expense', 'เงินเดือนพนักงาน'),
('6400', 'ค่าการตลาด', 'expense', 'operating_expense', 'ค่าใช้จ่ายการตลาด');

COMMIT;