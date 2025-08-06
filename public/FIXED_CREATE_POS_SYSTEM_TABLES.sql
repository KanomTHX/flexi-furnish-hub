-- สร้างตารางสำหรับระบบ POS และโมดูลต่างๆ (เวอร์ชันแก้ไขแล้ว)
-- สำหรับ Supabase PostgreSQL Database

-- ลบตารางเก่าก่อน (ถ้ามี)
DROP TABLE IF EXISTS installment_payments CASCADE;
DROP TABLE IF EXISTS installment_plans CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS accounting_transactions CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS sales_transaction_items CASCADE;
DROP TABLE IF EXISTS sales_transactions CASCADE;
DROP TABLE IF EXISTS product_inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- ===== 1. ตารางหลักของระบบ =====

-- ตาราง branches (สาขา)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง employees (พนักงาน)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 2. ระบบ POS =====

-- ตาราง customers (ลูกค้า)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    customer_code VARCHAR(20) UNIQUE,
    type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'business')),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_id VARCHAR(20),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    last_purchase_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง product_categories (หมวดหมู่สินค้า)
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง products (สินค้า)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'piece',
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 1000,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง product_inventory (สต็อกสินค้าแต่ละสาขา)
CREATE TABLE product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'discontinued')),
    UNIQUE(branch_id, product_id)
);

-- ตาราง sales_transactions (ธุรกรรมการขาย)
CREATE TABLE sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง sales_transaction_items (รายการสินค้าในการขาย)
CREATE TABLE sales_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 3. ระบบคลังสินค้า =====

-- ตาราง warehouses (คลังสินค้า)
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง stock_movements (การเคลื่อนไหวสต็อก)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    product_id UUID REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment')),
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง purchase_orders (ใบสั่งซื้อ)
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact TEXT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง purchase_order_items (รายการสินค้าในใบสั่งซื้อ)
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. ระบบบัญชี =====

-- ตาราง chart_of_accounts (ผังบัญชี)
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(100),
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง journal_entries (รายการบัญชี)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง journal_entry_lines (รายการย่อยของบัญชี)
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(12,2) DEFAULT 0,
    credit_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง accounting_transactions (ธุรกรรมบัญชี)
CREATE TABLE accounting_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date DATE NOT NULL,
    reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('sales', 'purchase', 'payment', 'receipt', 'adjustment', 'other')),
    reference_id UUID,
    description TEXT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. ระบบเคลม =====

-- ตาราง claims (เคลม)
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    product_id UUID REFERENCES products(id),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_date DATE NOT NULL,
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('warranty', 'defect', 'damage', 'return', 'exchange')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'resolved')),
    resolution TEXT,
    compensation_amount DECIMAL(10,2) DEFAULT 0,
    handled_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. ระบบผ่อนชำระ =====

-- ตาราง installment_plans (แผนผ่อนชำระ)
CREATE TABLE installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    sales_transaction_id UUID REFERENCES sales_transactions(id),
    plan_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    down_payment DECIMAL(12,2) DEFAULT 0,
    installment_amount DECIMAL(12,2) NOT NULL,
    number_of_installments INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง installment_payments (การชำระผ่อน)
CREATE TABLE installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
    payment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
    late_fee DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== สร้าง Indexes สำหรับประสิทธิภาพ =====

-- Indexes สำหรับการค้นหา
CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_customers_branch ON customers(branch_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_transactions_branch ON sales_transactions(branch_id);
CREATE INDEX idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX idx_accounting_transactions_branch ON accounting_transactions(branch_id);
CREATE INDEX idx_accounting_transactions_date ON accounting_transactions(transaction_date);

-- ===== สร้าง Triggers สำหรับ Auto-update =====

-- Function สำหรับ update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Triggers สำหรับ auto-update timestamp
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ข้อมูลตัวอย่าง =====

-- ข้อมูลสาขา
INSERT INTO branches (code, name, address, phone, manager_name) VALUES
('BKK', 'สาขากรุงเทพฯ', '123 ถนนสุขุมวิท กรุงเทพฯ', '02-123-4567', 'นายสมชาย ใจดี'),
('CNX', 'สาขาเชียงใหม่', '456 ถนนนิมมานเหมินท์ เชียงใหม่', '053-123-456', 'นางสาวสมหญิง รักงาน'),
('HKT', 'สาขาภูเก็ต', '789 ถนนป่าตอง ภูเก็ต', '076-123-456', 'นายสมศักดิ์ ขยันทำงาน');

-- ข้อมูลหมวดหมู่สินค้า
INSERT INTO product_categories (code, name, description) VALUES
('LIV', 'เฟอร์นิเจอร์ห้องนั่งเล่น', 'โซฟา เก้าอี้ โต๊ะกาแฟ'),
('BED', 'เฟอร์นิเจอร์ห้องนอน', 'เตียง ตู้เสื้อผ้า โต๊ะแป้ง'),
('OFF', 'เฟอร์นิเจอร์สำนักงาน', 'โต๊ะทำงาน เก้าอี้สำนักงาน ตู้เอกสาร'),
('DEC', 'อุปกรณ์ตแต่งบ้าน', 'โคมไฟ กระจก ของตกแต่ง');

-- ข้อมูลผังบัญชีพื้นฐาน
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category) VALUES
('1000', 'เงินสด', 'asset', 'current_asset'),
('1100', 'ลูกหนี้การค้า', 'asset', 'current_asset'),
('1200', 'สินค้าคงเหลือ', 'asset', 'current_asset'),
('2000', 'เจ้าหนี้การค้า', 'liability', 'current_liability'),
('3000', 'ทุนจดทะเบียน', 'equity', 'capital'),
('4000', 'รายได้จากการขาย', 'revenue', 'sales_revenue'),
('5000', 'ต้นทุนขาย', 'expense', 'cost_of_goods_sold'),
('6000', 'ค่าใช้จ่ายในการดำเนินงาน', 'expense', 'operating_expense');

-- แสดงผลลัพธ์
SELECT 'POS System tables created successfully!' as result;
SELECT 'Total tables created: ' || COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'branches', 'employees', 'customers', 'product_categories', 'products', 
    'product_inventory', 'sales_transactions', 'sales_transaction_items',
    'warehouses', 'stock_movements', 'purchase_orders', 'purchase_order_items',
    'chart_of_accounts', 'journal_entries', 'journal_entry_lines', 
    'accounting_transactions', 'claims', 'installment_plans', 'installment_payments'
);