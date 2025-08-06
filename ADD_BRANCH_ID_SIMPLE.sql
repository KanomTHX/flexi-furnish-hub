-- คำสั่ง SQL แบบง่ายสำหรับเพิ่ม Column branch_id
-- สำหรับ Supabase PostgreSQL Database

-- 1. สร้างตาราง branches ก่อน (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. เพิ่ม branch_id ในตาราง employees
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'branch_id') THEN
            ALTER TABLE employees ADD COLUMN branch_id UUID REFERENCES branches(id);
            CREATE INDEX idx_employees_branch_id ON employees(branch_id);
        END IF;
    END IF;
END $$;

-- 3. เพิ่ม branch_id ในตาราง sales_transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales_transactions') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_transactions' AND column_name = 'branch_id') THEN
            ALTER TABLE sales_transactions ADD COLUMN branch_id UUID REFERENCES branches(id);
            CREATE INDEX idx_sales_transactions_branch_id ON sales_transactions(branch_id);
        END IF;
    END IF;
END $$;

-- 4. เพิ่ม branch_id ในตาราง product_inventory
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_inventory') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_inventory' AND column_name = 'branch_id') THEN
            ALTER TABLE product_inventory ADD COLUMN branch_id UUID REFERENCES branches(id);
            CREATE INDEX idx_product_inventory_branch_id ON product_inventory(branch_id);
        END IF;
    END IF;
END $$;

-- 5. เพิ่มข้อมูลตัวอย่างสำหรับ branches
INSERT INTO branches (name) VALUES 
('สาขาหลัก'),
('สาขาไผ่ท่าโพ'),
('สาขาบางมูลนาก'),
('สาขาทับคล้อ'),
('สาขาอุตรดิตถ์')
ON CONFLICT DO NOTHING;

-- 6. อัปเดตข้อมูลเดิมให้มี branch_id (ใช้สาขาหลักเป็นค่าเริ่มต้น)
DO $$
DECLARE
    default_branch_id UUID;
BEGIN
    -- หา ID ของสาขาหลัก
    SELECT id INTO default_branch_id FROM branches WHERE name = 'สาขาหลัก' LIMIT 1;
    
    -- อัปเดต employees ที่ยังไม่มี branch_id
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        UPDATE employees SET branch_id = default_branch_id WHERE branch_id IS NULL;
    END IF;
    
    -- อัปเดต sales_transactions ที่ยังไม่มี branch_id
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sales_transactions') THEN
        UPDATE sales_transactions SET branch_id = default_branch_id WHERE branch_id IS NULL;
    END IF;
    
    -- อัปเดต product_inventory ที่ยังไม่มี branch_id
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_inventory') THEN
        UPDATE product_inventory SET branch_id = default_branch_id WHERE branch_id IS NULL;
    END IF;
END $$;

-- 7. แสดงผลลัพธ์
SELECT 'branch_id columns added successfully!' as result;