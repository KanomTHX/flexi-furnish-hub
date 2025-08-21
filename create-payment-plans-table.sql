-- สร้างตารางแม่แบบแผนผ่อนชำระ (Payment Plans Templates)
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    number_of_installments INTEGER NOT NULL,
    down_payment_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    processing_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_amount DECIMAL(12,2) NOT NULL DEFAULT 999999999,
    requires_guarantor BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มข้อมูลแม่แบบแผนผ่อนชำระ
INSERT INTO payment_plans (
    plan_number,
    name,
    number_of_installments,
    down_payment_percent,
    interest_rate,
    processing_fee,
    min_amount,
    max_amount,
    requires_guarantor,
    description,
    is_active
) VALUES 
    ('PLAN006', 'แผนผ่อน 6 เดือน', 6, 20.00, 5.00, 500.00, 10000.00, 100000.00, false, 'แผนผ่อนชำระระยะสั้น เหมาะสำหรับสินค้าราคาไม่สูง', true),
    ('PLAN012', 'แผนผ่อน 12 เดือน', 12, 15.00, 7.00, 800.00, 20000.00, 200000.00, false, 'แผนผ่อนชำระยอดนิยม เหมาะสำหรับเฟอร์นิเจอร์ทั่วไป', true),
    ('PLAN018', 'แผนผ่อน 18 เดือน', 18, 10.00, 9.00, 1200.00, 50000.00, 300000.00, true, 'แผนผ่อนชำระระยะกลาง เหมาะสำหรับเฟอร์นิเจอร์ราคาสูง', true),
    ('PLAN024', 'แผนผ่อน 24 เดือน', 24, 10.00, 12.00, 1500.00, 100000.00, 500000.00, true, 'แผนผ่อนชำระระยะยาว เหมาะสำหรับชุดเฟอร์นิเจอร์ครบชุด', true),
    ('PLAN036', 'แผนผ่อน 36 เดือน', 36, 5.00, 15.00, 2000.00, 200000.00, 1000000.00, true, 'แผนผ่อนชำระระยะยาวสุด เหมาะสำหรับโครงการตกแต่งบ้านทั้งหลัง', true)
ON CONFLICT (plan_number) DO NOTHING;

-- สร้าง index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_payment_plans_active ON payment_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_plans_plan_number ON payment_plans(plan_number);

SELECT 'Payment plans table created successfully!' as message;