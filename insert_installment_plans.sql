-- ===================================================================
-- SQL สำหรับเพิ่มแผนผ่อนชำระในฐานข้อมูล
-- ===================================================================

-- ลบแผนเดิม (ถ้ามี) เพื่อป้องกันข้อมูลซ้ำ
DELETE FROM installment_plans WHERE plan_number IN ('PLAN003', 'PLAN006', 'PLAN009', 'PLAN012', 'PLAN024');

-- เพิ่มแผนผ่อนชำระใหม่
INSERT INTO installment_plans (
    plan_number,
    plan_name,
    description,
    number_of_installments,
    interest_rate,
    down_payment_percent,
    processing_fee,
    min_amount,
    max_amount,
    requires_guarantor,
    is_active,
    status,
    created_at,
    updated_at
) VALUES 
-- แผน 3 เดือน (ไม่มีดอกเบี้ย)
(
    'PLAN003',
    'ผ่อน 0% 3 เดือน',
    'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาไม่สูง',
    3,
    0,
    30,
    200,
    5000,
    30000,
    false,
    true,
    'active',
    NOW(),
    NOW()
),

-- แผน 6 เดือน (ไม่มีดอกเบี้ย)
(
    'PLAN006',
    'ผ่อน 0% 6 เดือน',
    'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาปานกลาง',
    6,
    0,
    20,
    300,
    10000,
    50000,
    false,
    true,
    'active',
    NOW(),
    NOW()
),

-- แผน 9 เดือน (ดอกเบี้ย 3%)
(
    'PLAN009',
    'ผ่อน 3% 9 เดือน',
    'ผ่อนชำระ 9 งวด ดอกเบี้ย 3% ต่อปี เหมาะสำหรับสินค้าราคาปานกลาง',
    9,
    3,
    15,
    400,
    15000,
    80000,
    false,
    true,
    'active',
    NOW(),
    NOW()
),

-- แผน 12 เดือน (ดอกเบี้ย 5%)
(
    'PLAN012',
    'ผ่อน 5% 12 เดือน',
    'ผ่อนชำระ 12 งวด ดอกเบี้ย 5% ต่อปี เหมาะสำหรับสินค้าราคาสูง',
    12,
    5,
    10,
    500,
    20000,
    150000,
    false,
    true,
    'active',
    NOW(),
    NOW()
),

-- แผน 24 เดือน (ดอกเบี้ย 8%, ต้องมีผู้ค้ำประกัน)
(
    'PLAN024',
    'ผ่อน 8% 24 เดือน',
    'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี เหมาะสำหรับสินค้าราคาสูง ต้องมีผู้ค้ำประกัน',
    24,
    8,
    10,
    1000,
    50000,
    300000,
    true,
    true,
    'active',
    NOW(),
    NOW()
);

-- ตรวจสอบผลลัพธ์
SELECT 
    plan_number,
    plan_name,
    number_of_installments as months,
    interest_rate,
    down_payment_percent,
    processing_fee,
    min_amount,
    max_amount,
    requires_guarantor,
    is_active,
    created_at
FROM installment_plans 
WHERE is_active = true 
ORDER BY number_of_installments;

-- แสดงสถิติ
SELECT 
    COUNT(*) as total_plans,
    COUNT(CASE WHEN requires_guarantor = false THEN 1 END) as no_guarantor_plans,
    COUNT(CASE WHEN requires_guarantor = true THEN 1 END) as guarantor_required_plans,
    COUNT(CASE WHEN interest_rate = 0 THEN 1 END) as zero_interest_plans,
    COUNT(CASE WHEN interest_rate > 0 THEN 1 END) as interest_plans
FROM installment_plans 
WHERE is_active = true;