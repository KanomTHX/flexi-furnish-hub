-- ===================================================================
-- DATABASE SCHEMA FOR INSTALLMENT CONTRACT SYSTEM
-- ตารางฐานข้อมูลสำหรับระบบสัญญาผ่อนชำระ
-- ===================================================================

-- ตารางข้อมูลลูกค้า (ปรับปรุงเพิ่มฟิลด์ใหม่)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- ข้อมูลเพิ่มเติมสำหรับสัญญาผ่อน
    id_card VARCHAR(17) UNIQUE, -- เลขบัตรประชาชน (1-2345-67890-12-3)
    occupation VARCHAR(255), -- อาชีพ
    monthly_income DECIMAL(12,2), -- รายได้ต่อเดือน
    workplace VARCHAR(255), -- สถานที่ทำงาน
    work_address TEXT, -- ที่อยู่ที่ทำงาน
    
    -- ผู้ติดต่อฉุกเฉิน
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    
    -- ข้อมูลเครดิต
    credit_score INTEGER DEFAULT 0,
    blacklisted BOOLEAN DEFAULT FALSE,
    
    -- หมายเหตุ
    notes TEXT,
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    branch_id UUID
);

-- ตารางข้อมูลผู้ค้ำประกัน (ตารางใหม่)
CREATE TABLE guarantors (
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

-- ตารางแผนผ่อนชำระ (ปรับปรุงเพิ่มฟิลด์)
CREATE TABLE installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    months INTEGER NOT NULL, -- จำนวนงวด
    interest_rate DECIMAL(5,2) NOT NULL, -- อัตราดอกเบี้ยต่อปี (%)
    down_payment_percent DECIMAL(5,2) NOT NULL, -- เปอร์เซ็นต์เงินดาวน์
    processing_fee DECIMAL(10,2) DEFAULT 0, -- ค่าธรรมเนียมการจัดทำสัญญา
    description TEXT,
    
    -- เงื่อนไขการใช้งาน
    min_amount DECIMAL(12,2) DEFAULT 0, -- ยอดเงินขั้นต่ำ
    max_amount DECIMAL(12,2), -- ยอดเงินสูงสุด
    requires_guarantor BOOLEAN DEFAULT FALSE, -- บังคับใช้ผู้ค้ำประกัน
    
    -- สถานะ
    is_active BOOLEAN DEFAULT TRUE,
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- ตารางสัญญาผ่อนชำระ (ปรับปรุงเพิ่มฟิลด์ผู้ค้ำประกัน)
CREATE TABLE installment_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    sale_id UUID, -- อ้างอิงไปยังการขาย
    customer_id UUID NOT NULL REFERENCES customers(id),
    plan_id UUID NOT NULL REFERENCES installment_plans(id),
    
    -- ข้อมูลผู้ค้ำประกัน (ใหม่)
    guarantor_id UUID REFERENCES guarantors(id),
    requires_guarantor BOOLEAN DEFAULT FALSE,
    
    -- จำนวนเงิน
    total_amount DECIMAL(12,2) NOT NULL, -- ยอดรวมสินค้า
    down_payment DECIMAL(12,2) NOT NULL, -- เงินดาวน์
    financed_amount DECIMAL(12,2) NOT NULL, -- ยอดที่ผ่อน
    total_interest DECIMAL(12,2) NOT NULL, -- ดอกเบี้ยรวม
    processing_fee DECIMAL(12,2) DEFAULT 0, -- ค่าธรรมเนียม
    total_payable DECIMAL(12,2) NOT NULL, -- ยอดที่ต้องชำระรวม
    monthly_payment DECIMAL(12,2) NOT NULL, -- ค่างวดต่อเดือน
    
    -- วันที่
    contract_date DATE NOT NULL,
    first_payment_date DATE NOT NULL,
    last_payment_date DATE NOT NULL,
    
    -- สถานะ
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'defaulted', 'cancelled')),
    
    -- การชำระเงิน
    paid_installments INTEGER DEFAULT 0,
    remaining_installments INTEGER,
    total_paid DECIMAL(12,2) DEFAULT 0,
    remaining_balance DECIMAL(12,2),
    
    -- ข้อมูลเพิ่มเติม
    collateral TEXT, -- หลักประกัน
    terms TEXT, -- เงื่อนไขพิเศษ
    notes TEXT, -- หมายเหตุ
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    branch_id UUID
);

-- ตารางการชำระเงินงวด (ปรับปรุงเพิ่มฟิลด์)
CREATE TABLE installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES installment_contracts(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL, -- งวดที่
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    principal_amount DECIMAL(12,2) NOT NULL, -- เงินต้น
    interest_amount DECIMAL(12,2) NOT NULL, -- ดอกเบี้ย
    
    -- สถานะการชำระ
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    payment_method VARCHAR(50),
    receipt_number VARCHAR(100),
    
    -- ข้อมูลเพิ่มเติม
    late_fee DECIMAL(10,2) DEFAULT 0, -- ค่าปรับล่าช้า
    discount DECIMAL(10,2) DEFAULT 0, -- ส่วนลด
    notes TEXT,
    
    -- ข้อมูลระบบ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by UUID,
    branch_id UUID,
    
    UNIQUE(contract_id, installment_number)
);

-- ตารางประวัติการเปลี่ยนแปลงสัญญา (ตารางใหม่)
CREATE TABLE contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES installment_contracts(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'payment', 'status_change'
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- ตารางเอกสารแนบ (ตารางใหม่)
CREATE TABLE contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES installment_contracts(id) ON DELETE CASCADE,
    guarantor_id UUID REFERENCES guarantors(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL, -- 'id_card', 'income_proof', 'work_certificate', 'contract', 'other'
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Customers indexes
CREATE INDEX idx_customers_id_card ON customers(id_card);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_branch_id ON customers(branch_id);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Guarantors indexes
CREATE INDEX idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX idx_guarantors_phone ON guarantors(phone);
CREATE INDEX idx_guarantors_branch_id ON guarantors(branch_id);

-- Installment contracts indexes
CREATE INDEX idx_contracts_contract_number ON installment_contracts(contract_number);
CREATE INDEX idx_contracts_customer_id ON installment_contracts(customer_id);
CREATE INDEX idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX idx_contracts_status ON installment_contracts(status);
CREATE INDEX idx_contracts_branch_id ON installment_contracts(branch_id);
CREATE INDEX idx_contracts_contract_date ON installment_contracts(contract_date);

-- Installment payments indexes
CREATE INDEX idx_payments_contract_id ON installment_payments(contract_id);
CREATE INDEX idx_payments_due_date ON installment_payments(due_date);
CREATE INDEX idx_payments_status ON installment_payments(status);
CREATE INDEX idx_payments_branch_id ON installment_payments(branch_id);

-- Contract history indexes
CREATE INDEX idx_contract_history_contract_id ON contract_history(contract_id);
CREATE INDEX idx_contract_history_created_at ON contract_history(created_at);

-- Contract documents indexes
CREATE INDEX idx_documents_contract_id ON contract_documents(contract_id);
CREATE INDEX idx_documents_guarantor_id ON contract_documents(guarantor_id);
CREATE INDEX idx_documents_customer_id ON contract_documents(customer_id);
CREATE INDEX idx_documents_type ON contract_documents(document_type);

-- ===================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ===================================================================

-- Function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers สำหรับ updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guarantors_updated_at BEFORE UPDATE ON guarantors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_plans_updated_at BEFORE UPDATE ON installment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_contracts_updated_at BEFORE UPDATE ON installment_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON installment_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_contract_balance_trigger 
    AFTER UPDATE ON installment_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contract_balance();

-- ===================================================================
-- SAMPLE DATA
-- ===================================================================

-- แผนผ่อนชำระตัวอย่าง
INSERT INTO installment_plans (name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor) VALUES
('ผ่อน 0% 6 งวด', 6, 0.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE),
('ผ่อน 0% 12 งวด', 12, 0.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE),
('ผ่อน 8% 24 งวด', 24, 8.00, 25.00, 2000.00, 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี', 20000, 500000, TRUE),
('ผ่อน 10% 36 งวด', 36, 10.00, 30.00, 3000.00, 'ผ่อนชำระ 36 งวด ดอกเบี้ย 10% ต่อปี', 50000, 1000000, TRUE);

-- ===================================================================
-- VIEWS FOR REPORTING
-- ===================================================================

-- View สำหรับสรุปข้อมูลสัญญา
CREATE VIEW contract_summary AS
SELECT 
    c.*,
    cust.name as customer_name,
    cust.phone as customer_phone,
    g.name as guarantor_name,
    g.phone as guarantor_phone,
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

-- View สำหรับรายงานการชำระเงิน
CREATE VIEW payment_report AS
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
-- FUNCTIONS FOR BUSINESS LOGIC
-- ===================================================================

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

-- ===================================================================
-- SECURITY POLICIES (RLS)
-- ===================================================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Policies จะถูกเพิ่มตามระบบ authentication ที่ใช้งาน

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE customers IS 'ตารางข้อมูลลูกค้า รวมข้อมูลสำหรับสัญญาผ่อนชำระ';
COMMENT ON TABLE guarantors IS 'ตารางข้อมูลผู้ค้ำประกัน';
COMMENT ON TABLE installment_plans IS 'ตารางแผนผ่อนชำระ';
COMMENT ON TABLE installment_contracts IS 'ตารางสัญญาผ่อนชำระ';
COMMENT ON TABLE installment_payments IS 'ตารางการชำระเงินรายงวด';
COMMENT ON TABLE contract_history IS 'ตารางประวัติการเปลี่ยนแปลงสัญญา';
COMMENT ON TABLE contract_documents IS 'ตารางเอกสารแนบ';

COMMENT ON COLUMN customers.id_card IS 'เลขบัตรประชาชน รูปแบบ 1-2345-67890-12-3';
COMMENT ON COLUMN customers.monthly_income IS 'รายได้ต่อเดือนในหน่วยบาท';
COMMENT ON COLUMN guarantors.id_card IS 'เลขบัตรประชาชนผู้ค้ำประกัน';
COMMENT ON COLUMN installment_contracts.requires_guarantor IS 'ระบุว่าสัญญานี้ต้องมีผู้ค้ำประกันหรือไม่';
COMMENT ON COLUMN installment_payments.late_fee IS 'ค่าปรับล่าช้า';