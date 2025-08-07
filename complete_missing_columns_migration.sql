-- ===================================================================
-- COMPLETE MISSING COLUMNS MIGRATION
-- เพิ่มคอลัมน์ที่ขาดหายในตารางต่างๆ
-- ===================================================================

-- 1. เพิ่มคอลัมน์ที่ขาดหายในตาราง guarantors
ALTER TABLE guarantors 
ADD COLUMN IF NOT EXISTS workplace VARCHAR(255),
ADD COLUMN IF NOT EXISTS work_address TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. เพิ่มคอลัมน์ที่ขาดหายในตาราง installment_contracts
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id),
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES installment_plans(id),
ADD COLUMN IF NOT EXISTS guarantor_id UUID REFERENCES guarantors(id),
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS financed_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS first_payment_date DATE,
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS contract_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS total_interest DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payable DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_installments INTEGER,
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 3. เพิ่มคอลัมน์ที่ขาดหายในตาราง installment_payments
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_date DATE,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);

-- 4. เพิ่มคอลัมน์ที่ขาดหายในตาราง contract_documents
ALTER TABLE contract_documents 
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- 5. สร้างตาราง contract_history สำหรับเก็บประวัติการเปลี่ยนแปลง
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES installment_contracts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 6. สร้างตาราง installment_notifications สำหรับการแจ้งเตือน
CREATE TABLE IF NOT EXISTS installment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    contract_id UUID REFERENCES installment_contracts(id),
    customer_id UUID REFERENCES customers(id),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'unread',
    due_date DATE,
    amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. เพิ่ม indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_phone ON guarantors(phone);
CREATE INDEX IF NOT EXISTS idx_guarantors_branch ON guarantors(branch_id);

CREATE INDEX IF NOT EXISTS idx_contracts_customer ON installment_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_plan ON installment_contracts(plan_id);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON installment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON installment_contracts(contract_number);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON installment_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON installment_payments(status);

CREATE INDEX IF NOT EXISTS idx_documents_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_guarantor ON contract_documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON contract_documents(customer_id);

CREATE INDEX IF NOT EXISTS idx_history_contract ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_contract ON installment_notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON installment_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON installment_notifications(status);

-- 8. เพิ่ม comments สำหรับอธิบายตาราง
COMMENT ON TABLE guarantors IS 'ข้อมูลผู้ค้ำประกัน';
COMMENT ON TABLE installment_contracts IS 'สัญญาผ่อนชำระ';
COMMENT ON TABLE installment_payments IS 'การชำระเงินงวด';
COMMENT ON TABLE contract_documents IS 'เอกสารแนบสัญญา';
COMMENT ON TABLE contract_history IS 'ประวัติการเปลี่ยนแปลงสัญญา';
COMMENT ON TABLE installment_notifications IS 'การแจ้งเตือนระบบผ่อนชำระ';

-- 9. เพิ่ม constraints สำหรับความถูกต้องของข้อมูล
ALTER TABLE installment_contracts 
ADD CONSTRAINT IF NOT EXISTS chk_total_amount_positive CHECK (total_amount > 0),
ADD CONSTRAINT IF NOT EXISTS chk_down_payment_positive CHECK (down_payment >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_monthly_payment_positive CHECK (monthly_payment > 0);

ALTER TABLE installment_payments 
ADD CONSTRAINT IF NOT EXISTS chk_amount_positive CHECK (amount > 0),
ADD CONSTRAINT IF NOT EXISTS chk_installment_number_positive CHECK (installment_number > 0);

-- 10. สร้าง RLS policies (Row Level Security) - ถ้าต้องการ
-- ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE installment_contracts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- เสร็จสิ้น
SELECT 'Complete missing columns migration finished successfully!' as result;