-- ===================================================================
-- FINAL MISSING COLUMNS MIGRATION FOR INSTALLMENT SYSTEM
-- รันใน Supabase SQL Editor เพื่อเพิ่มคอลัมน์ที่ขาดหาย
-- ===================================================================

-- เพิ่มคอลัมน์ใน installment_contracts
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS financed_amount DECIMAL(12,2);
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_interest DECIMAL(12,2) DEFAULT 0;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12,2) DEFAULT 0;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_payable DECIMAL(12,2);
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS contract_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS first_payment_date DATE;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS remaining_installments INTEGER;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0;
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2);
ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- เพิ่มคอลัมน์ใน installment_payments
ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2);
ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);

-- เพิ่มคอลัมน์ใน guarantors
ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- สร้างตารางใหม่
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

-- เพิ่ม Foreign Key Constraints (ถ้าต้องการ)
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_customer FOREIGN KEY (customer_id) REFERENCES customers(id);
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_plan FOREIGN KEY (plan_id) REFERENCES installment_plans(id);
-- ALTER TABLE installment_contracts ADD CONSTRAINT fk_contracts_guarantor FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);

-- เพิ่ม Indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_contracts_customer ON installment_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_plan ON installment_contracts(plan_id);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON installment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON installment_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON installment_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON installment_payments(status);

-- เสร็จสิ้น
SELECT 'Final missing columns migration completed successfully!' as result;