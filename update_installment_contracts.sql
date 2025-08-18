-- อัปเดตตาราง installment_contracts เพื่อรองรับ Serial Numbers

-- เพิ่มคอลัมน์ serial_numbers สำหรับเก็บ array ของ serial number IDs
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]'::jsonb;

-- สร้าง GIN index สำหรับ serial_numbers เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_installment_contracts_serial_numbers 
ON installment_contracts USING GIN (serial_numbers);

-- เพิ่มคอลัมน์เพิ่มเติมสำหรับระบบเช่าซื้อ
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guarantor_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS guarantor_id_card VARCHAR(20),
ADD COLUMN IF NOT EXISTS guarantor_address TEXT,
ADD COLUMN IF NOT EXISTS contract_terms TEXT,
ADD COLUMN IF NOT EXISTS late_payment_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS repossession_date DATE,
ADD COLUMN IF NOT EXISTS repossession_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- อัปเดตตาราง installment_payments เพื่อรองรับข้อมูลเพิ่มเติม
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- สร้าง index เพิ่มเติมเพื่อเพิ่มประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_installment_contracts_status 
ON installment_contracts (status);

CREATE INDEX IF NOT EXISTS idx_installment_contracts_customer_id 
ON installment_contracts (customer_id);

CREATE INDEX IF NOT EXISTS idx_installment_payments_contract_id 
ON installment_payments (contract_id);

CREATE INDEX IF NOT EXISTS idx_installment_payments_payment_date 
ON installment_payments (payment_date);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_status 
ON serial_numbers (status);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_branch 
ON serial_numbers (product_id, branch_id);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_contract_id 
ON serial_numbers (installment_contract_id) WHERE installment_contract_id IS NOT NULL;

-- Add constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_installment_contracts_interest_rate') THEN
        ALTER TABLE installment_contracts 
        ADD CONSTRAINT chk_installment_contracts_interest_rate 
        CHECK (interest_rate >= 0 AND interest_rate <= 100);
    END IF;
END $$;

-- Note: num_installments column does not exist in current schema, skipping constraint

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_installment_payments_amount_paid') THEN
        ALTER TABLE installment_payments 
        ADD CONSTRAINT chk_installment_payments_amount_paid 
        CHECK (amount_paid >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_serial_numbers_status') THEN
        ALTER TABLE serial_numbers 
        ADD CONSTRAINT chk_serial_numbers_status 
        CHECK (status IN ('available', 'sold', 'installment', 'returned', 'damaged'));
    END IF;
END $$;

-- เพิ่ม comment สำหรับ documentation
COMMENT ON COLUMN installment_contracts.serial_numbers IS 'Array of serial number IDs associated with this contract';
COMMENT ON COLUMN installment_contracts.guarantor_name IS 'Name of the guarantor for this contract';
COMMENT ON COLUMN installment_contracts.late_payment_fee IS 'Fee charged for late payments';
COMMENT ON COLUMN installment_contracts.grace_period_days IS 'Number of days grace period before late fee is applied';
COMMENT ON COLUMN installment_payments.late_fee IS 'Late fee amount for this payment';
COMMENT ON COLUMN installment_payments.payment_channel IS 'Channel used for payment (cash, bank_transfer, credit_card, etc.)';
COMMENT ON COLUMN serial_numbers.installment_contract_id IS 'ID of installment contract this serial number is associated with';

-- สร้าง function สำหรับอัปเดต remaining_balance อัตโนมัติ
CREATE OR REPLACE FUNCTION update_contract_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดต total_paid และ remaining_balance
    UPDATE installment_contracts 
    SET 
        total_paid = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM installment_payments 
            WHERE contract_id = NEW.contract_id
        ),
        paid_installments = (
            SELECT COUNT(*) 
            FROM installment_payments 
            WHERE contract_id = NEW.contract_id
        )
    WHERE id = NEW.contract_id;
    
    -- อัปเดต remaining_balance
    UPDATE installment_contracts 
    SET 
        remaining_balance = total_payable - total_paid,
        remaining_installments = num_installments - paid_installments
    WHERE id = NEW.contract_id;
    
    -- อัปเดตสถานะสัญญาถ้าชำระครบแล้ว
    UPDATE installment_contracts 
    SET status = 'completed'
    WHERE id = NEW.contract_id 
    AND remaining_balance <= 0 
    AND status = 'active';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับอัปเดตยอดคงเหลืออัตโนมัติ
DROP TRIGGER IF EXISTS trigger_update_contract_balance ON installment_payments;
CREATE TRIGGER trigger_update_contract_balance
    AFTER INSERT OR UPDATE OR DELETE ON installment_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_balance();

-- สร้าง function สำหรับอัปเดตสถานะ serial numbers
CREATE OR REPLACE FUNCTION update_serial_number_status()
RETURNS TRIGGER AS $$
BEGIN
    -- เมื่อสัญญาถูกยกเลิกหรือปิด ให้อัปเดตสถานะ serial numbers
    IF NEW.status IN ('cancelled', 'completed', 'repossessed') AND OLD.status = 'active' THEN
        UPDATE serial_numbers 
        SET 
            status = CASE 
                WHEN NEW.status = 'completed' THEN 'sold'
                WHEN NEW.status = 'repossessed' THEN 'returned'
                ELSE 'available'
            END,
            installment_contract_id = CASE 
                WHEN NEW.status IN ('cancelled', 'repossessed') THEN NULL
                ELSE installment_contract_id
            END
        WHERE installment_contract_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับอัปเดตสถานะ serial numbers
DROP TRIGGER IF EXISTS trigger_update_serial_status ON installment_contracts;
CREATE TRIGGER trigger_update_serial_status
    AFTER UPDATE ON installment_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_serial_number_status();

COMMIT;