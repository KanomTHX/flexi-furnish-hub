-- ===================================================================
-- FIXED INSTALLMENT PLANS MIGRATION
-- แก้ไขปัญหา number_of_installments column
-- ===================================================================

-- 1. เพิ่มคอลัมน์ที่อาจจะขาดหาย (สำหรับระบบผ่อนชำระ)
ALTER TABLE installment_plans 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS months INTEGER,
ADD COLUMN IF NOT EXISTS down_payment_percent DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS number_of_installments INTEGER; -- เพิ่มคอลัมน์นี้

-- 2. เพิ่มข้อมูลตัวอย่างแผนผ่อนชำระ (รวม number_of_installments)
DO $$
DECLARE
    default_branch_id UUID;
BEGIN
    -- หา branch_id ที่ใช้ได้
    SELECT id INTO default_branch_id FROM branches LIMIT 1;
    IF default_branch_id IS NULL THEN
        default_branch_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- เพิ่มข้อมูลตัวอย่าง (รวม number_of_installments)
    INSERT INTO installment_plans (
        plan_number,            -- จำเป็น
        total_amount,           -- จำเป็น
        name,                   -- เพิ่มเติม
        months,                 -- เพิ่มเติม
        number_of_installments, -- จำเป็น (ตามที่พบจาก error)
        interest_rate,          -- มีอยู่แล้ว
        down_payment,           -- มีอยู่แล้ว
        down_payment_percent,   -- เพิ่มเติม
        processing_fee,         -- เพิ่มเติม
        description,            -- เพิ่มเติม
        min_amount,             -- เพิ่มเติม
        max_amount,             -- เพิ่มเติม
        requires_guarantor,     -- เพิ่มเติม
        is_active,              -- เพิ่มเติม
        installment_amount,     -- เพิ่มเติม
        status,                 -- มีอยู่แล้ว
        branch_id               -- มีอยู่แล้ว
    )
    SELECT * FROM (VALUES
        ('PLAN003', 10000.00, 'ผ่อน 0% 3 งวด', 3, 3, 0.00, 1000.00, 10.00, 200.00, 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3000, 30000, FALSE, TRUE, 3333.33, 'active', default_branch_id),
        ('PLAN006', 15000.00, 'ผ่อน 0% 6 งวด', 6, 6, 0.00, 2000.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE, TRUE, 2166.67, 'active', default_branch_id),
        ('PLAN012', 50000.00, 'ผ่อน 0% 12 งวด', 12, 12, 0.00, 3000.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE, TRUE, 3916.67, 'active', default_branch_id),
        ('PLAN024', 100000.00, 'ผ่อน 8% 24 งวด', 24, 24, 8.00, 5000.00, 25.00, 2000.00, 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี', 20000, 500000, TRUE, TRUE, 4583.33, 'active', default_branch_id),
        ('PLAN036', 200000.00, 'ผ่อน 10% 36 งวด', 36, 36, 10.00, 10000.00, 30.00, 3000.00, 'ผ่อนชำระ 36 งวด ดอกเบี้ย 10% ต่อปี', 50000, 1000000, TRUE, TRUE, 6111.11, 'active', default_branch_id)
    ) AS new_plans(plan_number, total_amount, name, months, number_of_installments, interest_rate, down_payment, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active, installment_amount, status, branch_id)
    WHERE NOT EXISTS (
        SELECT 1 FROM installment_plans 
        WHERE installment_plans.plan_number = new_plans.plan_number
    );
    
    RAISE NOTICE 'Added % installment plans successfully', 
        (SELECT COUNT(*) FROM installment_plans WHERE plan_number LIKE 'PLAN%');
END $$;

-- 3. สร้าง indexes สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_installment_plans_plan_number ON installment_plans(plan_number);
CREATE INDEX IF NOT EXISTS idx_installment_plans_name ON installment_plans(name);
CREATE INDEX IF NOT EXISTS idx_installment_plans_active ON installment_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);

-- 4. เพิ่ม comments
COMMENT ON COLUMN installment_plans.plan_number IS 'รหัสแผนผ่อนชำระ (จำเป็น)';
COMMENT ON COLUMN installment_plans.total_amount IS 'ยอดเงินรวมของแผน (จำเป็น)';
COMMENT ON COLUMN installment_plans.number_of_installments IS 'จำนวนงวดการผ่อนชำระ (จำเป็น)';
COMMENT ON COLUMN installment_plans.name IS 'ชื่อแผนผ่อนชำระ';
COMMENT ON COLUMN installment_plans.months IS 'จำนวนเดือนการผ่อนชำระ';
COMMENT ON COLUMN installment_plans.installment_amount IS 'ยอดเงินผ่อนต่องวด';
COMMENT ON COLUMN installment_plans.requires_guarantor IS 'ต้องมีผู้ค้ำประกันหรือไม่';

-- 5. ตรวจสอบผลลัพธ์
SELECT 
    plan_number,
    name,
    months,
    number_of_installments,
    total_amount,
    installment_amount,
    status
FROM installment_plans 
WHERE plan_number LIKE 'PLAN%'
ORDER BY plan_number;

-- เสร็จสิ้น
SELECT 'Fixed installment_plans migration with number_of_installments completed successfully!' as result;