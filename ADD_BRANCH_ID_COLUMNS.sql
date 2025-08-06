-- คำสั่ง SQL สำหรับเพิ่ม Column branch_id ในตารางต่างๆ
-- สำหรับ Supabase PostgreSQL Database

-- 1. เพิ่ม branch_id ในตาราง employees
ALTER TABLE employees 
ADD COLUMN branch_id UUID REFERENCES branches(id);

-- เพิ่ม comment สำหรับ column
COMMENT ON COLUMN employees.branch_id IS 'Foreign key reference to branches table';

-- สร้าง index สำหรับ performance
CREATE INDEX idx_employees_branch_id ON employees(branch_id);

-- อัปเดตข้อมูลเดิมให้มี branch_id (ตัวอย่าง)
-- UPDATE employees SET branch_id = 'your-default-branch-id' WHERE branch_id IS NULL;

-- 2. เพิ่ม branch_id ในตาราง sales_transactions (ถ้ายังไม่มี)
ALTER TABLE sales_transactions 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- เพิ่ม comment
COMMENT ON COLUMN sales_transactions.branch_id IS 'Foreign key reference to branches table';

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_sales_transactions_branch_id ON sales_transactions(branch_id);

-- 3. เพิ่ม branch_id ในตาราง product_inventory (ถ้ายังไม่มี)
ALTER TABLE product_inventory 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- เพิ่ม comment
COMMENT ON COLUMN product_inventory.branch_id IS 'Foreign key reference to branches table';

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_product_inventory_branch_id ON product_inventory(branch_id);

-- 4. เพิ่ม branch_id ในตารางอื่นๆ ที่อาจจำเป็น

-- ตาราง customers (ถ้ามี)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers') THEN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
        CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);
    END IF;
END $$;

-- ตาราง orders (ถ้ามี)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
        CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
    END IF;
END $$;

-- ตาราง transactions (ถ้ามี - สำหรับระบบบัญชี)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
        CREATE INDEX IF NOT EXISTS idx_transactions_branch_id ON transactions(branch_id);
    END IF;
END $$;

-- 5. สร้างตาราง branches (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม columns ทีละตัวถ้ายังไม่มี
DO $$
BEGIN
    -- เพิ่ม column code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'code') THEN
        ALTER TABLE branches ADD COLUMN code VARCHAR(10) UNIQUE;
    END IF;
    
    -- เพิ่ม column name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'name') THEN
        ALTER TABLE branches ADD COLUMN name VARCHAR(255);
    END IF;
    
    -- เพิ่ม column address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'address') THEN
        ALTER TABLE branches ADD COLUMN address TEXT;
    END IF;
    
    -- เพิ่ม column phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'phone') THEN
        ALTER TABLE branches ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- เพิ่ม column email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'email') THEN
        ALTER TABLE branches ADD COLUMN email VARCHAR(255);
    END IF;
    
    -- เพิ่ม column manager_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'manager_name') THEN
        ALTER TABLE branches ADD COLUMN manager_name VARCHAR(255);
    END IF;
    
    -- เพิ่ม column status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'status') THEN
        ALTER TABLE branches ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    END IF;
END $$;

-- เพิ่ม comment สำหรับตาราง branches
COMMENT ON TABLE branches IS 'Master table for branch information';

-- สร้าง index สำหรับ branches
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);
CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);

-- 6. เพิ่มข้อมูลตัวอย่างสำหรับ branches (ถ้าต้องการ)
DO $$
BEGIN
    -- ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    IF NOT EXISTS (SELECT 1 FROM branches WHERE code = 'PTH') THEN
        INSERT INTO branches (code, name, address, phone, manager_name) VALUES
        ('PTH', 'สาขาไผ่ท่าโพ', '123 ถนนไผ่ท่าโพ', '042-123-456', 'นายสมชาย ใจดี');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM branches WHERE code = 'BMN') THEN
        INSERT INTO branches (code, name, address, phone, manager_name) VALUES
        ('BMN', 'สาขาบางมูลนาก', '456 ถนนบางมูลนาก', '043-234-567', 'นางสมหญิง รักงาน');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM branches WHERE code = 'TKL') THEN
        INSERT INTO branches (code, name, address, phone, manager_name) VALUES
        ('TKL', 'สาขาทับคล้อ', '789 ถนนทับคล้อ', '044-345-678', 'นายสมศักดิ์ ขยัน');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM branches WHERE code = 'UTD') THEN
        INSERT INTO branches (code, name, address, phone, manager_name) VALUES
        ('UTD', 'สาขาอุตรดิตถ์', '321 ถนนอุตรดิตถ์', '055-456-789', 'นางสมใส ยิ้มแย้ม');
    END IF;
END $$;

-- 7. สร้าง RLS (Row Level Security) policies สำหรับ branch-based access
-- หมายเหตุ: ข้ามส่วนนี้ไปก่อน เนื่องจากยังไม่มีตาราง user_profiles
-- สามารถเพิ่ม RLS policies ได้ภายหลังเมื่อมีระบบ authentication แล้ว

-- Enable RLS on tables (ถ้าต้องการ)
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

-- ตัวอย่าง policy สำหรับอนาคต (เมื่อมี user_profiles แล้ว):
/*
CREATE POLICY employees_branch_policy ON employees
    FOR ALL USING (
        branch_id = (SELECT branch_id FROM user_profiles WHERE user_id = auth.uid())
        OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );
*/

-- 8. สร้าง function สำหรับ auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับ branches table
CREATE TRIGGER update_branches_updated_at 
    BEFORE UPDATE ON branches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. สร้าง view สำหรับ branch statistics
CREATE OR REPLACE VIEW branch_statistics AS
SELECT 
    b.id,
    b.code,
    b.name,
    COUNT(DISTINCT e.id) as employee_count,
    COUNT(DISTINCT st.id) as sales_count,
    COALESCE(SUM(st.total_amount), 0) as total_sales,
    COUNT(DISTINCT pi.id) as product_count,
    COALESCE(SUM(pi.quantity), 0) as total_inventory
FROM branches b
LEFT JOIN employees e ON b.id = e.branch_id
LEFT JOIN sales_transactions st ON b.id = st.branch_id
LEFT JOIN product_inventory pi ON b.id = pi.branch_id
GROUP BY b.id, b.code, b.name;

-- เพิ่ม comment สำหรับ view
COMMENT ON VIEW branch_statistics IS 'Aggregated statistics for each branch';

-- 10. Grant permissions (ปรับตามความเหมาะสม)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO authenticated;
-- GRANT SELECT ON branch_statistics TO authenticated;

-- สำหรับ Supabase, อาจต้องใช้:
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;