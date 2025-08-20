-- ========================================
-- ระบบจัดการร้านเฟอร์นิเจอร์ครบวงจร
-- Furniture Store Management System
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- ENUMS (ประเภทข้อมูล)
-- ========================================

-- User roles
CREATE TYPE user_role AS ENUM (
  'admin', 
  'manager', 
  'employee', 
  'sales', 
  'warehouse', 
  'accountant'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending', 
  'paid', 
  'overdue', 
  'cancelled', 
  'completed'
);

-- Transaction status
CREATE TYPE transaction_status AS ENUM (
  'draft', 
  'pending', 
  'approved', 
  'completed', 
  'cancelled'
);

-- Stock movement types
CREATE TYPE movement_type AS ENUM (
  'in', 
  'out', 
  'transfer', 
  'adjustment', 
  'return'
);

-- Claim types
CREATE TYPE claim_type AS ENUM (
  'warranty', 
  'defect', 
  'damage', 
  'return', 
  'exchange'
);

-- ========================================
-- CORE TABLES (ตารางหลัก)
-- ========================================

-- 1. Branches (สาขา)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employee Profiles (โปรไฟล์พนักงาน)
CREATE TABLE employee_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'employee',
  branch_id UUID REFERENCES branches(id),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Employees (พนักงาน)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  salary DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CUSTOMER & PRODUCT TABLES
-- ========================================

-- 4. Customers (ลูกค้า)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  customer_code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'business')),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  tax_id VARCHAR(20),
  id_card VARCHAR(20),
  occupation VARCHAR(100),
  monthly_income DECIMAL(12,2),
  workplace VARCHAR(255),
  work_address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  credit_score INTEGER DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  total_purchases DECIMAL(12,2) DEFAULT 0,
  last_purchase_date DATE,
  blacklisted BOOLEAN DEFAULT false,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Product Categories (หมวดหมู่สินค้า)
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Products (สินค้า)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  model VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'ชิ้น',
  cost_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) DEFAULT 0,
  barcode VARCHAR(100),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SALES SYSTEM TABLES
-- ========================================

-- 7. Sales Transactions (ธุรกรรมการขาย)
CREATE TABLE sales_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  employee_id UUID REFERENCES employees(id),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'credit')),
  status transaction_status DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sales Transaction Items (รายการสินค้าในการขาย)
CREATE TABLE sales_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- WAREHOUSE SYSTEM TABLES
-- ========================================

-- 9. Warehouses (คลังสินค้า)
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  location TEXT,
  manager_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Product Inventory (สต็อกสินค้าแต่ละสาขา)
CREATE TABLE product_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  branch_id UUID REFERENCES branches(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, branch_id, warehouse_id)
);

-- 11. Stock Movements (การเคลื่อนไหวสต็อก)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type movement_type NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_type VARCHAR(50),
  reference_id UUID,
  reference_number VARCHAR(100),
  notes TEXT,
  performed_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Suppliers (ซัพพลายเออร์)
CREATE TABLE suppliers (
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

-- 13. Purchase Orders (ใบสั่งซื้อ)
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL, -- Keep for backward compatibility
  supplier_contact TEXT,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Purchase Order Items (รายการสินค้าในใบสั่งซื้อ)
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Supplier Invoices (ใบแจ้งหนี้จากซัพพลายเออร์)
CREATE TABLE supplier_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
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
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Supplier Invoice Items (รายการสินค้าในใบแจ้งหนี้)
CREATE TABLE supplier_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Supplier Payments (การชำระเงินให้ซัพพลายเออร์)
CREATE TABLE supplier_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  invoice_id UUID REFERENCES supplier_invoices(id),
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card')),
  reference_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ACCOUNTING SYSTEM TABLES
-- ========================================

-- 18. Chart of Accounts (ผังบัญชี)
CREATE TABLE chart_of_accounts (
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

-- 15. Journal Entries (รายการบัญชี)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Journal Entry Lines (รายการย่อยของบัญชี)
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  description TEXT,
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Accounting Transactions (ธุรกรรมบัญชี)
CREATE TABLE accounting_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('sales', 'purchase', 'payment', 'receipt', 'adjustment', 'other')),
  reference_id UUID,
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CLAIMS SYSTEM TABLE
-- ========================================

-- 18. Claims (เคลม)
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID REFERENCES products(id),
  claim_number VARCHAR(50) UNIQUE NOT NULL,
  claim_date DATE NOT NULL,
  claim_type claim_type NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'resolved')),
  resolution TEXT,
  compensation_amount DECIMAL(10,2) DEFAULT 0,
  handled_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INSTALLMENT SYSTEM TABLES
-- ========================================

-- 19. Guarantors (ผู้ค้ำประกัน)
CREATE TABLE guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  name VARCHAR(255) NOT NULL,
  id_card VARCHAR(20) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  occupation VARCHAR(100) NOT NULL,
  workplace VARCHAR(255),
  work_address TEXT,
  monthly_income DECIMAL(12,2) NOT NULL,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(100),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Installment Contracts (สัญญาผ่อนชำระ)
CREATE TABLE installment_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  guarantor_id UUID REFERENCES guarantors(id),
  transaction_id UUID REFERENCES sales_transactions(id),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  contract_date DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_months INTEGER NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2),
  processing_fee DECIMAL(10,2) DEFAULT 0,
  total_payable DECIMAL(12,2),
  total_interest DECIMAL(12,2),
  financed_amount DECIMAL(12,2),
  remaining_amount DECIMAL(12,2) NOT NULL,
  remaining_balance DECIMAL(12,2),
  remaining_installments INTEGER,
  paid_installments INTEGER DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  first_payment_date DATE,
  last_payment_date DATE,
  status payment_status DEFAULT 'pending',
  requires_guarantor BOOLEAN DEFAULT false,
  collateral TEXT,
  terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Branches
CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_branches_status ON branches(status);

-- Employee Profiles
CREATE INDEX idx_employee_profiles_user_id ON employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_employee_code ON employee_profiles(employee_code);
CREATE INDEX idx_employee_profiles_branch_id ON employee_profiles(branch_id);
CREATE INDEX idx_employee_profiles_role ON employee_profiles(role);

-- Employees
CREATE INDEX idx_employees_branch_id ON employees(branch_id);
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_employees_status ON employees(status);

-- Customers
CREATE INDEX idx_customers_branch_id ON customers(branch_id);
CREATE INDEX idx_customers_customer_code ON customers(customer_code);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Suppliers
CREATE INDEX idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX idx_suppliers_supplier_name ON suppliers(supplier_name);
CREATE INDEX idx_suppliers_status ON suppliers(status);

-- Purchase Orders
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Supplier Invoices
CREATE INDEX idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX idx_supplier_invoices_invoice_number ON supplier_invoices(invoice_number);
CREATE INDEX idx_supplier_invoices_invoice_date ON supplier_invoices(invoice_date);
CREATE INDEX idx_supplier_invoices_due_date ON supplier_invoices(due_date);
CREATE INDEX idx_supplier_invoices_status ON supplier_invoices(status);

-- Supplier Payments
CREATE INDEX idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_invoice_id ON supplier_payments(invoice_id);
CREATE INDEX idx_supplier_payments_payment_date ON supplier_payments(payment_date);

-- Sales Transactions
CREATE INDEX idx_sales_transactions_branch_id ON sales_transactions(branch_id);
CREATE INDEX idx_sales_transactions_customer_id ON sales_transactions(customer_id);
CREATE INDEX idx_sales_transactions_employee_id ON sales_transactions(employee_id);
CREATE INDEX idx_sales_transactions_transaction_number ON sales_transactions(transaction_number);
CREATE INDEX idx_sales_transactions_transaction_date ON sales_transactions(transaction_date);
CREATE INDEX idx_sales_transactions_status ON sales_transactions(status);

-- Stock Movements
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse_id ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Accounting
CREATE INDEX idx_chart_of_accounts_account_code ON chart_of_accounts(account_code);
CREATE INDEX idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);
CREATE INDEX idx_journal_entries_entry_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX idx_accounting_transactions_transaction_number ON accounting_transactions(transaction_number);
CREATE INDEX idx_accounting_transactions_transaction_date ON accounting_transactions(transaction_date);

-- Claims
CREATE INDEX idx_claims_branch_id ON claims(branch_id);
CREATE INDEX idx_claims_customer_id ON claims(customer_id);
CREATE INDEX idx_claims_claim_number ON claims(claim_number);
CREATE INDEX idx_claims_claim_date ON claims(claim_date);
CREATE INDEX idx_claims_status ON claims(status);

-- Installment Contracts
CREATE INDEX idx_installment_contracts_branch_id ON installment_contracts(branch_id);
CREATE INDEX idx_installment_contracts_customer_id ON installment_contracts(customer_id);
CREATE INDEX idx_installment_contracts_contract_number ON installment_contracts(contract_number);
CREATE INDEX idx_installment_contracts_status ON installment_contracts(status);

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

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_purchase_order_number() RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
  year_month TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Get the next sequence number for this month
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(year_month) + 4) AS INTEGER)), 0) + 1
  INTO counter
  FROM purchase_orders
  WHERE order_number ~ ('^PO' || year_month || '[0-9]+$');
  
  -- Format as PO202412001, PO202412002, etc.
  new_number := 'PO' || year_month || LPAD(counter::TEXT, 3, '0');
  
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
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON employee_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounting_transactions_updated_at BEFORE UPDATE ON accounting_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guarantors_updated_at BEFORE UPDATE ON guarantors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_contracts_updated_at BEFORE UPDATE ON installment_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA (ข้อมูลตัวอย่าง)
-- ========================================

-- Insert sample branch
INSERT INTO branches (name, code, address, phone, manager_name) VALUES
('สาขาหลัก', 'MAIN001', '123 ถนนสุขุมวิท กรุงเทพฯ 10110', '02-123-4567', 'คุณสมชาย ใจดี'),
('สาขาลาดพร้าว', 'LP001', '456 ถนนลาดพร้าว กรุงเทพฯ 10230', '02-234-5678', 'คุณสมหญิง รักดี'),
('สาขาบางนา', 'BN001', '789 ถนนบางนา กรุงเทพฯ 10260', '02-345-6789', 'คุณสมศักดิ์ มีดี');

-- Insert sample product categories
INSERT INTO product_categories (code, name, description) VALUES
('SOFA', 'โซฟา', 'โซฟาและเก้าอี้นั่งเล่น'),
('TABLE', 'โต๊ะ', 'โต๊ะทุกประเภท'),
('CHAIR', 'เก้าอี้', 'เก้าอี้ทุกประเภท'),
('BED', 'เตียง', 'เตียงและอุปกรณ์นอน'),
('CABINET', 'ตู้', 'ตู้เสื้อผ้าและตู้เก็บของ');

-- Insert sample products
INSERT INTO products (category_id, product_code, name, description, brand, model, cost_price, selling_price, barcode) VALUES
((SELECT id FROM product_categories WHERE code = 'SOFA'), 'SF001', 'โซฟา 3 ที่นั่ง สีน้ำตาล', 'โซฟาหนังแท้ 3 ที่นั่ง สีน้ำตาล', 'HomePro', 'Classic-3S', 15000, 25000, '1234567890001'),
((SELECT id FROM product_categories WHERE code = 'TABLE'), 'TB001', 'โต๊ะทำงานไม้โอ๊ค', 'โต๊ะทำงานไม้โอ๊คแท้ ขนาด 120x60 ซม.', 'Office+', 'Desk-120', 8000, 15000, '1234567890002'),
((SELECT id FROM product_categories WHERE code = 'CHAIR'), 'CH001', 'เก้าอี้สำนักงาน', 'เก้าอี้สำนักงานเพื่อสุขภาพ', 'ErgoMax', 'Chair-Pro', 5000, 9000, '1234567890003'),
((SELECT id FROM product_categories WHERE code = 'BED'), 'BD001', 'เตียงนอน 6 ฟุต', 'เตียงนอนไม้สัก ขนาด 6 ฟุต', 'SleepWell', 'King-6F', 12000, 20000, '1234567890004'),
((SELECT id FROM product_categories WHERE code = 'CABINET'), 'CB001', 'ตู้เสื้อผ้า 4 บาน', 'ตู้เสื้อผ้าไม้ MDF 4 บาน', 'StorageMax', 'Wardrobe-4D', 10000, 18000, '1234567890005');

-- Insert sample warehouse
INSERT INTO warehouses (name, code, location) VALUES
('คลังสินค้าหลัก', 'WH001', 'โกดังบางนา กรุงเทพฯ'),
('คลังสินค้าลาดพร้าว', 'WH002', 'โกดังลาดพร้าว กรุงเทพฯ');

-- Insert sample chart of accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category) VALUES
('1000', 'สินทรัพย์', 'asset', 'สินทรัพย์หลัก'),
('1100', 'เงินสด', 'asset', 'สินทรัพย์หมุนเวียน'),
('1200', 'ลูกหนี้การค้า', 'asset', 'สินทรัพย์หมุนเวียน'),
('1300', 'สินค้าคงเหลือ', 'asset', 'สินทรัพย์หมุนเวียน'),
('2000', 'หนี้สิน', 'liability', 'หนี้สินหลัก'),
('2100', 'เจ้าหนี้การค้า', 'liability', 'หนี้สินหมุนเวียน'),
('3000', 'ทุน', 'equity', 'ส่วนของเจ้าของ'),
('4000', 'รายได้', 'revenue', 'รายได้จากการขาย'),
('5000', 'ต้นทุนขาย', 'expense', 'ต้นทุนและค่าใช้จ่าย'),
('6000', 'ค่าใช้จ่ายในการขาย', 'expense', 'ต้นทุนและค่าใช้จ่าย');

-- ========================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ========================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_contracts ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (Allow all for authenticated users for now)
-- In production, you should create more specific policies based on user roles and branch access

-- Policy for employee_profiles (users can see their own profile, admins can see all)
CREATE POLICY "Users can view own profile" ON employee_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON employee_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON employee_profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role = 'admin'
  )
);

-- Basic policies for other tables (allow all for authenticated users)
-- You should customize these based on your business requirements
CREATE POLICY "Allow all for authenticated users" ON branches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON product_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON sales_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON sales_transaction_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON warehouses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON product_inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON chart_of_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON journal_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON journal_entry_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON accounting_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON claims FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON guarantors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON installment_contracts FOR ALL USING (auth.role() = 'authenticated');

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '- 20 main tables';
    RAISE NOTICE '- All necessary indexes';
    RAISE NOTICE '- Triggers for automatic timestamps';
    RAISE NOTICE '- Sample data inserted';
    RAISE NOTICE '- Row Level Security enabled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test the connection in your app';
    RAISE NOTICE '2. Create user accounts if needed';
    RAISE NOTICE '3. Customize RLS policies for your needs';
    RAISE NOTICE '4. Add more sample data as required';
    RAISE NOTICE '========================================';
END $$;