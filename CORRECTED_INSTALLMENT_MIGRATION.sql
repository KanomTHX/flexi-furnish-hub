-- ===================================================================
-- CORRECTED INSTALLMENT MIGRATION
-- ตาม Column Names ที่ถูกต้องในฐานข้อมูล
-- ===================================================================

-- 1. เพิ่มคอลัมน์ที่ขาดหายใน installment_contracts
-- (ตามโครงสร้างจริงที่ค้นพบ)
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS plan_id UUID,
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS financed_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS total_interest DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_payable DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS contract_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS first_payment_date DATE,
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_installments INTEGER,
ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- 2. เพิ่มคอลัมน์ที่ขาดหายใน installment_payments
-- (ใช้ชื่อคอลัมน์ที่ถูกต้อง: installment_plan_id, payment_number, amount_due)
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS contract_id UUID,
ADD COLUMN IF NOT EXISTS principal_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS interest_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

-- 3. เพิ่มคอลัมน์ที่ขาดหายใน guarantors
ALTER TABLE guarantors 
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- 4. สร้างตารางใหม่ที่จำเป็น
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS installment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    contract_id UUID,
    customer_id UUID,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'unread',
    due_date DATE,
    amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. เพิ่ม Indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON installment_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_plan ON installment_contracts(plan_id);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON installment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_transaction ON installment_contracts(transaction_id);

CREATE INDEX IF NOT EXISTS idx_payments_contract ON installment_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_plan ON installment_payments(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON installment_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_number ON installment_payments(payment_number);

CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_phone ON guarantors(phone);
CREATE INDEX IF NOT EXISTS idx_guarantors_branch ON guarantors(branch_id);

CREATE INDEX IF NOT EXISTS idx_history_contract ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_contract ON installment_notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON installment_notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON installment_notifications(status);

-- 6. เพิ่ม Foreign Key Constraints (ถ้าต้องการ)
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_plan FOREIGN KEY (plan_id) REFERENCES installment_plans(id);
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_guarantor FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);
-- ALTER TABLE installment_payments ADD CONSTRAINT fk_payments_contract FOREIGN KEY (contract_id) REFERENCES installment_contracts(id);
-- ALTER TABLE installment_payments ADD CONSTRAINT fk_payments_plan FOREIGN KEY (installment_plan_id) REFERENCES installment_plans(id);

-- 7. เพิ่ม Check Constraints (แยกคำสั่ง)
DO $$
BEGIN
    -- เพิ่ม constraints สำหรับ installment_contracts
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_down_payment_positive') THEN
        ALTER TABLE installment_contracts ADD CONSTRAINT chk_down_payment_positive CHECK (down_payment >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_remaining_amount_positive') THEN
        ALTER TABLE installment_contracts ADD CONSTRAINT chk_remaining_amount_positive CHECK (remaining_amount >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_monthly_payment_positive') THEN
        ALTER TABLE installment_contracts ADD CONSTRAINT chk_monthly_payment_positive CHECK (monthly_payment > 0);
    END IF;
    
    -- เพิ่ม constraints สำหรับ installment_payments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_amount_due_positive') THEN
        ALTER TABLE installment_payments ADD CONSTRAINT chk_amount_due_positive CHECK (amount_due > 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_amount_paid_positive') THEN
        ALTER TABLE installment_payments ADD CONSTRAINT chk_amount_paid_positive CHECK (amount_paid >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_number_positive') THEN
        ALTER TABLE installment_payments ADD CONSTRAINT chk_payment_number_positive CHECK (payment_number > 0);
    END IF;
END $$;

-- เสร็จสิ้น
SELECT 'Corrected installment migration completed successfully!' as result;