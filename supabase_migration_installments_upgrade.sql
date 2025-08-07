-- ===================================================================
-- SUPABASE MIGRATION: INSTALLMENT SYSTEM UPGRADE
-- การอัปเกรดระบบสัญญาผ่อนชำระ
-- ===================================================================

-- Migration: 20241208_installment_system_upgrade

BEGIN;

-- ===================================================================
-- 1. อัปเกรดตาราง customers (เพิ่มฟิลด์ใหม่)
-- ===================================================================

-- เพิ่มคอลัมน์ใหม่สำหรับข้อมูลลูกค้า
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id_card VARCHAR(17),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS workplace VARCHAR(255),
ADD COLUMN IF NOT EXISTS work_address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- เพิ่ม unique constraint สำหรับเลขบัตรประชาชน
ALTER TABLE customers 
ADD CONSTRAINT customers_id_card_unique UNIQUE (id_card);

-- ===================================================================
-- 2. สร้างตาราง guarantors (ผู้ค้ำประกัน)
-- ===================================================================

CREATE TABLE IF NOT EXISTS guarantors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    
    -- ข้อมูลบัตรประชาชน
    id_card VARCHAR(17) NOT NULL UNIQUE,
    
    -- ข้อมูลการงาน
    occupation VARCHAR(255) NOT NULL,
    monthly_income DECIMAL(12,2) NOT NULL,
    workplace VARCHAR(255),
    work_address TEXT,
    
    -- ผู้ติดต่อฉุกเฉินของผู้ค้ำประกัน
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    branch_id UUID
);

-- ===================================================================
-- 3. อัปเกรดตาราง installment_plans
-- ===================================================================

-- เพิ่มคอลัมน์ใหม่สำหรับแผนผ่อนชำระ
ALTER TABLE installment_plans 
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE;

-- ===================================================================
-- 4. อัปเกรดตาราง installment_contracts
-- ===================================================================

-- เพิ่มคอลัมน์ใหม่สำหรับสัญญาผ่อนชำระ
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID REFERENCES guarantors(id),
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- ===================================================================
-- 5. อัปเกรดตาราง installment_payments
-- ===================================================================

-- เพิ่มคอลัมน์ใหม่สำหรับการชำระเงิน
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- ===================================================================
-- 6. สร้างตารางใหม่
-- ===================================================================

-- ตารางประวัติการเปลี่ยนแปลงสัญญา
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES installment_contracts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- ตารางเอกสารแนบ
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES installment_contracts(id) ON DELETE CASCADE,
    guarantor_id UUID REFERENCES guarantors(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL
);

-- ===================================================================
-- 7. สร้าง INDEXES
-- ===================================================================

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_id_card ON customers(id_card);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON customers(branch_id);

-- Guarantors indexes
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_phone ON guarantors(phone);
CREATE INDEX IF NOT EXISTS idx_guarantors_branch_id ON guarantors(branch_id);

-- Installment contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_branch_id ON installment_contracts(branch_id);

-- Installment payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON installment_payments(branch_id);

-- Contract history indexes
CREATE INDEX IF NOT EXISTS idx_contract_history_contract_id ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_created_at ON contract_history(created_at);

-- Contract documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_guarantor_id ON contract_documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON contract_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON contract_documents(document_type);

-- ===================================================================
-- 8. สร้าง/อัปเดต FUNCTIONS
-- ===================================================================

-- Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function สำหรับสร้างเลขที่สัญญา
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
    contract_number TEXT;
    year_month TEXT;
    sequence_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM installment_contracts
    WHERE contract_number LIKE 'CT' || year_month || '%';
    
    contract_number := 'CT' || year_month || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN contract_number;
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับคำนวณค่างวด
CREATE OR REPLACE FUNCTION calculate_monthly_payment(
    principal DECIMAL,
    annual_rate DECIMAL,
    months INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    monthly_rate DECIMAL;
    monthly_payment DECIMAL;
BEGIN
    IF annual_rate = 0 THEN
        RETURN principal / months;
    END IF;
    
    monthly_rate := annual_rate / 100 / 12;
    monthly_payment := principal * (monthly_rate * POWER(1 + monthly_rate, months)) / 
                      (POWER(1 + monthly_rate, months) - 1);
    
    RETURN ROUND(monthly_payment, 2);
END;
$$ LANGUAGE plpgsql;

-- Function สำหรับอัปเดตยอดคงเหลือในสัญญา
CREATE OR REPLACE FUNCTION update_contract_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดตยอดคงเหลือเมื่อมีการชำระเงิน
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE installment_contracts 
        SET 
            total_paid = total_paid + NEW.paid_amount,
            remaining_balance = remaining_balance - NEW.paid_amount,
            paid_installments = paid_installments + 1,
            remaining_installments = remaining_installments - 1,
            updated_at = NOW()
        WHERE id = NEW.contract_id;
        
        -- ตรวจสอบว่าชำระครบแล้วหรือไม่
        UPDATE installment_contracts 
        SET status = 'completed'
        WHERE id = NEW.contract_id 
        AND remaining_installments = 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================================
-- 9. สร้าง TRIGGERS
-- ===================================================================

-- Triggers สำหรับ updated_at (เฉพาะตารางใหม่)
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
CREATE TRIGGER update_guarantors_updated_at 
    BEFORE UPDATE ON guarantors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger สำหรับอัปเดตยอดคงเหลือ
DROP TRIGGER IF EXISTS update_contract_balance_trigger ON installment_payments;
CREATE TRIGGER update_contract_balance_trigger 
    AFTER UPDATE ON installment_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contract_balance();

-- ===================================================================
-- 10. สร้าง VIEWS
-- ===================================================================

-- View สำหรับสรุปข้อมูลสัญญา (ปรับให้ตรงกับโครงสร้างจริง)
CREATE OR REPLACE VIEW contract_summary AS
SELECT 
    c.*,
    cust.name as customer_name,
    cust.phone as customer_phone,
    cust.id_card as customer_id_card,
    g.name as guarantor_name,
    g.phone as guarantor_phone,
    g.id_card as guarantor_id_card,
    p.name as plan_name,
    p.months as plan_months,
    p.interest_rate as plan_interest_rate,
    -- คำนวณสถานะการชำระ
    CASE 
        WHEN c.status = 'completed' THEN 'ชำระครบแล้ว'
        WHEN c.status = 'active' AND EXISTS (
            SELECT 1 FROM installment_payments ip 
            WHERE ip.contract_id = c.id 
            AND ip.status = 'overdue'
        ) THEN 'ค้างชำระ'
        WHEN c.status = 'active' THEN 'ปกติ'
        WHEN c.status = 'defaulted' THEN 'ผิดนัด'
        ELSE 'อื่นๆ'
    END as payment_status_text
FROM installment_contracts c
LEFT JOIN customers cust ON c.customer_id = cust.id
LEFT JOIN guarantors g ON c.guarantor_id = g.id
LEFT JOIN installment_plans p ON c.plan_id = p.id;

-- View สำหรับรายงานการชำระเงิน (ปรับให้ตรงกับโครงสร้างจริง)
CREATE OR REPLACE VIEW payment_report AS
SELECT 
    ip.*,
    c.contract_number,
    cust.name as customer_name,
    cust.phone as customer_phone,
    c.monthly_payment as scheduled_amount,
    CASE 
        WHEN ip.due_date < CURRENT_DATE AND ip.status = 'pending' THEN 'เกินกำหนด'
        WHEN ip.due_date = CURRENT_DATE AND ip.status = 'pending' THEN 'ครบกำหนดวันนี้'
        WHEN ip.status = 'paid' THEN 'ชำระแล้ว'
        ELSE 'ยังไม่ครบกำหนด'
    END as payment_status_text
FROM installment_payments ip
JOIN installment_contracts c ON ip.contract_id = c.id
JOIN customers cust ON c.customer_id = cust.id
ORDER BY ip.due_date DESC;

-- ===================================================================
-- 11. อัปเดตข้อมูลตัวอย่าง
-- ===================================================================

-- อัปเดตแผนผ่อนชำระที่มีอยู่
UPDATE installment_plans 
SET 
    min_amount = CASE 
        WHEN months <= 6 THEN 5000
        WHEN months <= 12 THEN 10000
        WHEN months <= 24 THEN 20000
        ELSE 50000
    END,
    max_amount = CASE 
        WHEN months <= 6 THEN 50000
        WHEN months <= 12 THEN 100000
        WHEN months <= 24 THEN 500000
        ELSE 1000000
    END,
    requires_guarantor = CASE 
        WHEN months > 24 OR interest_rate > 0 THEN TRUE
        ELSE FALSE
    END
WHERE min_amount IS NULL;

-- เพิ่มแผนผ่อนชำระใหม่ (ถ้ายังไม่มี)
INSERT INTO installment_plans (name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
SELECT * FROM (VALUES
    ('ผ่อน 0% 3 งวด', 3, 0.00, 10.00, 200.00, 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3000, 30000, FALSE, TRUE),
    ('ผ่อน 0% 6 งวด', 6, 0.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE, TRUE),
    ('ผ่อน 0% 12 งวด', 12, 0.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE, TRUE),
    ('ผ่อน 8% 24 งวด', 24, 8.00, 25.00, 2000.00, 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี', 20000, 500000, TRUE, TRUE),
    ('ผ่อน 10% 36 งวด', 36, 10.00, 30.00, 3000.00, 'ผ่อนชำระ 36 งวด ดอกเบี้ย 10% ต่อปี', 50000, 1000000, TRUE, TRUE)
) AS new_plans(name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM installment_plans 
    WHERE installment_plans.name = new_plans.name 
    AND installment_plans.months = new_plans.months
);

-- ===================================================================
-- 12. RLS POLICIES (ถ้าต้องการ)
-- ===================================================================

-- Enable RLS สำหรับตารางใหม่
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

-- Policies จะถูกเพิ่มตามระบบ authentication ที่ใช้งาน

-- ===================================================================
-- 13. COMMENTS
-- ===================================================================

COMMENT ON TABLE guarantors IS 'ตารางข้อมูลผู้ค้ำประกัน';
COMMENT ON TABLE contract_history IS 'ตารางประวัติการเปลี่ยนแปลงสัญญา';
COMMENT ON TABLE contract_documents IS 'ตารางเอกสารแนบ';

COMMENT ON COLUMN customers.id_card IS 'เลขบัตรประชาชน รูปแบบ 1-2345-67890-12-3';
COMMENT ON COLUMN customers.monthly_income IS 'รายได้ต่อเดือนในหน่วยบาท';
COMMENT ON COLUMN customers.emergency_contact_name IS 'ชื่อผู้ติดต่อฉุกเฉิน';
COMMENT ON COLUMN customers.emergency_contact_phone IS 'เบอร์โทรผู้ติดต่อฉุกเฉิน';
COMMENT ON COLUMN customers.emergency_contact_relationship IS 'ความสัมพันธ์กับผู้ติดต่อฉุกเฉิน';

COMMENT ON COLUMN guarantors.id_card IS 'เลขบัตรประชาชนผู้ค้ำประกัน';
COMMENT ON COLUMN guarantors.monthly_income IS 'รายได้ต่อเดือนของผู้ค้ำประกัน';

COMMENT ON COLUMN installment_contracts.guarantor_id IS 'ID ของผู้ค้ำประกัน';
COMMENT ON COLUMN installment_contracts.requires_guarantor IS 'ระบุว่าสัญญานี้ต้องมีผู้ค้ำประกันหรือไม่';
COMMENT ON COLUMN installment_contracts.collateral IS 'หลักประกัน';
COMMENT ON COLUMN installment_contracts.terms IS 'เงื่อนไขพิเศษของสัญญา';

COMMENT ON COLUMN installment_payments.late_fee IS 'ค่าปรับล่าช้า';
COMMENT ON COLUMN installment_payments.discount IS 'ส่วนลดที่ได้รับ';

-- ===================================================================
-- COMMIT TRANSACTION
-- ===================================================================

COMMIT;

-- ===================================================================
-- POST-MIGRATION VERIFICATION
-- ===================================================================

-- ตรวจสอบว่าตารางถูกสร้างครบถ้วน
DO $$
BEGIN
    -- ตรวจสอบตาราง guarantors
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guarantors') THEN
        RAISE EXCEPTION 'Table guarantors was not created';
    END IF;
    
    -- ตรวจสอบตาราง contract_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_history') THEN
        RAISE EXCEPTION 'Table contract_history was not created';
    END IF;
    
    -- ตรวจสอบตาราง contract_documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_documents') THEN
        RAISE EXCEPTION 'Table contract_documents was not created';
    END IF;
    
    -- ตรวจสอบคอลัมน์ใหม่ในตาราง customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'id_card') THEN
        RAISE EXCEPTION 'Column id_card was not added to customers table';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;