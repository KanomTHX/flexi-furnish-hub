-- สร้างตาราง serial_numbers สำหรับการผูก SN รายชิ้นกับสัญญาเช่าซื้อ
CREATE TABLE IF NOT EXISTS serial_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    serial_number VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'installment', 'returned')),
    cost_price NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    installment_contract_id UUID REFERENCES installment_contracts(id),
    received_date DATE DEFAULT CURRENT_DATE,
    sold_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_branch ON serial_numbers(branch_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_contract ON serial_numbers(installment_contract_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number);

-- สร้าง trigger สำหรับ updated_at
CREATE TRIGGER IF NOT EXISTS update_serial_numbers_updated_at
    BEFORE UPDATE ON serial_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่มคอลัมน์ serial_numbers ในตาราง installment_contracts เพื่อเก็บ JSON array ของ SN
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS serial_numbers JSONB DEFAULT '[]'::jsonb;

-- สร้าง index สำหรับ serial_numbers column
CREATE INDEX IF NOT EXISTS idx_contracts_serial_numbers ON installment_contracts USING GIN (serial_numbers);