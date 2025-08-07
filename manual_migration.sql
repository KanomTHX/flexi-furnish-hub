-- ===================================================================
-- MANUAL MIGRATION SCRIPT
-- รันใน Supabase SQL Editor
-- ===================================================================

-- 1. สร้างตาราง guarantors
CREATE TABLE IF NOT EXISTS guarantors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    id_card VARCHAR(17) NOT NULL UNIQUE,
    occupation VARCHAR(255) NOT NULL,
    monthly_income DECIMAL(12,2) NOT NULL,
    workplace VARCHAR(255),
    work_address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    branch_id UUID
);

-- 2. สร้างตาราง contract_history
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- 3. สร้างตาราง contract_documents
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID,
    guarantor_id UUID,
    customer_id UUID,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL
);

-- 4. เพิ่มคอลัมน์ในตาราง customers
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

-- 5. เพิ่มคอลัมน์ในตาราง installment_contracts
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 6. เพิ่มคอลัมน์ในตาราง installment_payments
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 7. เพิ่มคอลัมน์ในตาราง installment_plans
ALTER TABLE installment_plans 
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE;

-- 8. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_customers_id_card ON customers(id_card);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_phone ON guarantors(phone);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_history_contract_id ON contract_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_documents_guarantor_id ON contract_documents(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON contract_documents(customer_id);

-- 9. เพิ่ม unique constraint สำหรับ customers.id_card
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_id_card_unique' 
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_id_card_unique UNIQUE (id_card);
    END IF;
END $$;

-- 10. เพิ่ม foreign key constraints (เฉพาะเมื่อต้องการ)
DO $$
BEGIN
    -- Foreign key สำหรับ guarantor
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_contracts_guarantor' 
        AND table_name = 'installment_contracts'
    ) THEN
        ALTER TABLE installment_contracts 
        ADD CONSTRAINT fk_contracts_guarantor 
        FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);
    END IF;
    
    -- Foreign key สำหรับ contract_history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_history_contract' 
        AND table_name = 'contract_history'
    ) THEN
        ALTER TABLE contract_history 
        ADD CONSTRAINT fk_history_contract 
        FOREIGN KEY (contract_id) REFERENCES installment_contracts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 11. สร้าง functions ที่จำเป็น
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. สร้าง triggers
DROP TRIGGER IF EXISTS update_guarantors_updated_at ON guarantors;
CREATE TRIGGER update_guarantors_updated_at 
    BEFORE UPDATE ON guarantors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. เพิ่มคอลัมน์ที่จำเป็นในตาราง installment_plans
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

-- 14. เพิ่มข้อมูลตัวอย่างสำหรับ installment_plans (รันแยกหลังจาก migration หลัก)
-- หมายเหตุ: รันไฟล์ fixed_installment_plans_migration.sql แยกต่างหาก

-- 14. Enable RLS สำหรับตารางใหม่ (ถ้าต้องการ)
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

-- 15. เพิ่ม comments
COMMENT ON TABLE guarantors IS 'ตารางข้อมูลผู้ค้ำประกัน';
COMMENT ON TABLE contract_history IS 'ตารางประวัติการเปลี่ยนแปลงสัญญา';
COMMENT ON TABLE contract_documents IS 'ตารางเอกสารแนบ';

COMMENT ON COLUMN customers.id_card IS 'เลขบัตรประชาชน รูปแบบ 1-2345-67890-12-3';
COMMENT ON COLUMN customers.monthly_income IS 'รายได้ต่อเดือนในหน่วยบาท';
COMMENT ON COLUMN guarantors.id_card IS 'เลขบัตรประชาชนผู้ค้ำประกัน';
COMMENT ON COLUMN guarantors.monthly_income IS 'รายได้ต่อเดือนของผู้ค้ำประกัน';

-- เสร็จสิ้น
SELECT 'Migration completed successfully!' as result;