-- ===================================================================
-- FIXED MIGRATION FOR INSTALLMENT_PLANS
-- แก้ไขตามโครงสร้างตารางจริง
-- ===================================================================

-- ตารางปัจจุบันมีคอลัมน์: id, interest_rate, down_payment, status, created_at, updated_at, branch_id

-- 1. เพิ่มคอลัมน์ที่จำเป็นสำหรับระบบผ่อนชำระ
ALTER TABLE installment_plans 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS months INTEGER,
ADD COLUMN IF NOT EXISTS down_payment_percent DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. อัปเดตข้อมูลที่มีอยู่ (ถ้ามี) ให้มีค่าเริ่มต้น
UPDATE installment_plans 
SET 
    name = COALESCE(name, 'แผนผ่อนชำระ'),
    months = COALESCE(months, 12),
    down_payment_percent = COALESCE(down_payment_percent, 20.00),
    processing_fee = COALESCE(processing_fee, 500.00),
    description = COALESCE(description, 'แผนผ่อนชำระ'),
    is_active = COALESCE(is_active, TRUE)
WHERE name IS NULL OR months IS NULL;

-- 3. เพิ่มข้อมูลตัวอย่างแผนผ่อนชำระ
INSERT INTO installment_plans (
    plan_number,
    name, 
    months, 
    interest_rate, 
    down_payment, 
    down_payment_percent, 
    processing_fee, 
    description, 
    min_amount, 
    max_amount, 
    requires_guarantor, 
    is_active, 
    status,
    branch_id
)
SELECT * FROM (VALUES
    ('PLAN003', 'ผ่อน 0% 3 งวด', 3, 0.00, 1000.00, 10.00, 200.00, 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3000, 30000, FALSE, TRUE, 'active', '00000000-0000-0000-0000-000000000000'::uuid),
    ('PLAN006', 'ผ่อน 0% 6 งวด', 6, 0.00, 2000.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE, TRUE, 'active', '00000000-0000-0000-0000-000000000000'::uuid),
    ('PLAN012', 'ผ่อน 0% 12 งวด', 12, 0.00, 3000.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE, TRUE, 'active', '00000000-0000-0000-0000-000000000000'::uuid),
    ('PLAN024', 'ผ่อน 8% 24 งวด', 24, 8.00, 5000.00, 25.00, 2000.00, 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี', 20000, 500000, TRUE, TRUE, 'active', '00000000-0000-0000-0000-000000000000'::uuid),
    ('PLAN036', 'ผ่อน 10% 36 งวด', 36, 10.00, 10000.00, 30.00, 3000.00, 'ผ่อนชำระ 36 งวด ดอกเบี้ย 10% ต่อปี', 50000, 1000000, TRUE, TRUE, 'active', '00000000-0000-0000-0000-000000000000'::uuid)
) AS new_plans(plan_number, name, months, interest_rate, down_payment, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active, status, branch_id)
WHERE NOT EXISTS (
    SELECT 1 FROM installment_plans 
    WHERE installment_plans.plan_number = new_plans.plan_number
);

-- 4. สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_installment_plans_name ON installment_plans(name);
CREATE INDEX IF NOT EXISTS idx_installment_plans_active ON installment_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_installment_plans_months ON installment_plans(months);

-- 5. เพิ่ม comments
COMMENT ON COLUMN installment_plans.name IS 'ชื่อแผนผ่อนชำระ';
COMMENT ON COLUMN installment_plans.months IS 'จำนวนงวดการผ่อนชำระ';
COMMENT ON COLUMN installment_plans.interest_rate IS 'อัตราดอกเบี้ยต่อปี (%)';
COMMENT ON COLUMN installment_plans.down_payment IS 'จำนวนเงินดาวน์ (บาท)';
COMMENT ON COLUMN installment_plans.down_payment_percent IS 'เปอร์เซ็นต์เงินดาวน์';
COMMENT ON COLUMN installment_plans.processing_fee IS 'ค่าธรรมเนียมการจัดทำสัญญา';
COMMENT ON COLUMN installment_plans.min_amount IS 'ยอดเงินขั้นต่ำ';
COMMENT ON COLUMN installment_plans.max_amount IS 'ยอดเงินสูงสุด';
COMMENT ON COLUMN installment_plans.requires_guarantor IS 'ต้องมีผู้ค้ำประกันหรือไม่';

-- เสร็จสิ้น
SELECT 'Fixed installment_plans migration completed!' as result;