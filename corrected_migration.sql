-- ===================================================================
-- CORRECTED SUPABASE MIGRATION
-- ===================================================================

BEGIN;

-- เพิ่มคอลัมน์ใหม่ในตาราง customers
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

-- เพิ่ม unique constraint
ALTER TABLE customers 
ADD CONSTRAINT customers_id_card_unique UNIQUE (id_card);

-- เพิ่มคอลัมน์ใหม่ในตาราง installment_contracts
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- สร้างตาราง guarantors
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

-- สร้างตาราง contract_history
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

-- สร้างตาราง contract_documents
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

-- เพิ่ม foreign key constraints
ALTER TABLE installment_contracts 
ADD CONSTRAINT fk_contracts_guarantor 
FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);

ALTER TABLE contract_history 
ADD CONSTRAINT fk_history_contract 
FOREIGN KEY (contract_id) REFERENCES installment_contracts(id) ON DELETE CASCADE;

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_customers_id_card ON customers(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_history_contract_id ON contract_history(contract_id);

COMMIT;
