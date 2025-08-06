-- สร้างตารางสำหรับระบบ POS และโมดูลต่างๆ (เวอร์ชันแก้ไขแล้ว)
-- สำหรับ Supabase PostgreSQL Database

-- ===== 1. ตารางหลักของระบบ =====

-- ตาราง branches (สาขา)
CREATE TABLE IF NOT EXISTS branches (
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
CREATE TABLE IF NOT EXISTS employees (
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
CREATE TABLE IF NOT EXISTS customers (
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
CREATE TABLE IF NOT EXISTS product_categories (
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
CREATE TABLE IF NOT EXISTS products (
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
CREATE TABLE IF NOT EXISTS product_inventory (
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
CREATE TABLE IF NOT EXISTS sales_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    employee_id UUID REFERENCES employees(id),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'installment')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง sales_transaction_items (รายการสินค้าในการขาย)
CREATE TABLE IF NOT EXISTS sales_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 3. ระบบคลังสินค้า =====

-- ตาราง warehouses (คลังสินค้า)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50) DEFAULT 'main' CHECK (type IN ('main', 'secondary', 'temporary')),
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง stock_movements (การเคลื่อนไหวสต็อก)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'return')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'transfer', 'adjustment'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง purchase_orders (ใบสั่งซื้อ)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_contact TEXT,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง purchase_order_items (รายการสินค้าในใบสั่งซื้อ)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. ระบบบัญชี =====

-- ตาราง chart_of_accounts (ผังบัญชี)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(100),
    parent_account_id UUID REFERENCES chart_of_accounts(id),
    balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง journal_entries (รายการบัญชี)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง journal_entry_lines (รายการย่อยของบัญชี)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตาราง accounting_transactions (ธุรกรรมบัญชี)
CREATE TABLE IF NOT EXISTS accounting_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'payment', 'receipt', 'adjustment', 'transfer')),
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    source_module VARCHAR(50) NOT NULL,
    source_id UUID,
    journal_entry_id UUID REFERENCES journal_entries(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. ระบบเคลม =====

-- ตาราง claims (เคลม)
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    transaction_id UUID REFERENCES sales_transactions(id),
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('defect', 'damage', 'wrong_item', 'warranty', 'other')),
    description TEXT NOT NULL,
    claim_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'resolved')),
    resolution TEXT,
    created_by UUID REFERENCES employees(id),
    assigned_to UUID REFERENCES employees(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. ระบบผ่อนชำระ =====

-- ตาราง installment_plans (แผนผ่อนชำระ)
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    transaction_id UUID REFERENCES sales_transactions(id),
    plan_name VARCHAR(255) NOT NULL,
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
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_plan_id UUID REFERENCES installment_plans(id),
    payment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    payment_date DATE,
    late_fee DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 7. สร้าง Indexes สำหรับ Performance =====

-- Indexes สำหรับ branches
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);

-- Indexes สำหรับ employees
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Indexes สำหรับ customers
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Indexes สำหรับ products
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Indexes สำหรับ product_inventory
CREATE INDEX IF NOT EXISTS idx_inventory_branch_product ON product_inventory(branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON product_inventory(status);

-- Indexes สำหรับ sales_transactions
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON sales_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_transactions(payment_status);

-- Indexes สำหรับ accounting
CREATE INDEX IF NOT EXISTS idx_journal_entries_branch ON journal_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_branch ON accounting_transactions(branch_id);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_type ON accounting_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON accounting_transactions(transaction_date);

-- ===== 8. สร้าง Triggers สำหรับ Auto-update =====

-- Function สำหรับ update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers สำหรับ updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 9. เพิ่มข้อมูลตัวอย่าง =====

-- ข้อมูลสาขา
INSERT INTO branches (code, name, address, phone, manager_name) VALUES
('PTH', 'สาขาไผ่ท่าโพ', '123 ถนนไผ่ท่าโพ เมืองไผ่ท่าโพ', '042-123-456', 'นายสมชาย ใจดี'),
('BMN', 'สาขาบางมูลนาก', '456 ถนนบางมูลนาก เมืองบางมูลนาก', '043-234-567', 'นางสมหญิง รักงาน'),
('TKL', 'สาขาทับคล้อ', '789 ถนนทับคล้อ เมืองทับคล้อ', '044-345-678', 'นายสมศักดิ์ ขยัน'),
('UTD', 'สาขาอุตรดิตถ์', '321 ถนนอุตรดิตถ์ เมืองอุตรดิตถ์', '055-456-789', 'นางสมใส ยิ้มแย้ม')
ON CONFLICT (code) DO NOTHING;

-- ข้อมูลหมวดหมู่สินค้า
INSERT INTO product_categories (code, name, description) VALUES
('LIV', 'เฟอร์นิเจอร์ห้องนั่งเล่น', 'โซฟา เก้าอี้ โต๊ะกาแฟ'),
('BED', 'เฟอร์นิเจอร์ห้องนอน', 'เตียง ตู้เสื้อผ้า โต๊ะแป้ง'),
('OFF', 'เฟอร์นิเจอร์สำนักงาน', 'โต๊ะทำงาน เก้าอี้สำนักงาน ตู้เอกสาร'),
('DEC', 'อุปกรณ์ตแต่งบ้าน', 'โคมไฟ กระจก ของตกแต่ง')
ON CONFLICT (code) DO NOTHING;

-- ข้อมูลผังบัญชีพื้นฐาน
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_category) VALUES
('1000', 'เงินสด', 'asset', 'current_asset'),
('1100', 'ลูกหนี้การค้า', 'asset', 'current_asset'),
('1200', 'สินค้าคงเหลือ', 'asset', 'current_asset'),
('2000', 'เจ้าหนี้การค้า', 'liability', 'current_liability'),
('3000', 'ทุนจดทะเบียน', 'equity', 'owner_equity'),
('4000', 'รายได้จากการขาย', 'revenue', 'sales_revenue'),
('5000', 'ต้นทุนขาย', 'expense', 'cost_of_goods_sold'),
('6000', 'ค่าใช้จ่ายในการดำเนินงาน', 'expense', 'operating_expense')
ON CONFLICT (account_code) DO NOTHING;

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