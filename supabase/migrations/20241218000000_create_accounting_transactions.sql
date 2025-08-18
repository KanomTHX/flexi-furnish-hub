-- Create accounting_transactions table for POS integration
CREATE TABLE IF NOT EXISTS accounting_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- 'pos_sale', 'installment_payment', 'expense', 'invoice'
  reference_id UUID, -- ID ของธุรกรรมต้นฉบับ
  account_id VARCHAR(20) NOT NULL, -- รหัสบัญชี เช่น '1100' (เงินสด), '4100' (รายได้จากการขาย)
  account_name VARCHAR(255) NOT NULL, -- ชื่อบัญชี
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  branch_id UUID REFERENCES branches(id),
  employee_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_debit_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (debit_amount = 0 AND credit_amount > 0)
  ),
  CONSTRAINT check_amounts_positive CHECK (
    debit_amount >= 0 AND credit_amount >= 0
  )
);

-- Create indexes for better performance
CREATE INDEX idx_accounting_transactions_date ON accounting_transactions(transaction_date);
CREATE INDEX idx_accounting_transactions_reference ON accounting_transactions(reference_type, reference_id);
CREATE INDEX idx_accounting_transactions_account ON accounting_transactions(account_id);
CREATE INDEX idx_accounting_transactions_branch ON accounting_transactions(branch_id);
CREATE INDEX idx_accounting_transactions_number ON accounting_transactions(transaction_number);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_accounting_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accounting_transactions_updated_at
  BEFORE UPDATE ON accounting_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_transactions_updated_at();

-- Enable RLS
ALTER TABLE accounting_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view accounting transactions for their branch" ON accounting_transactions
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM employee_branches 
      WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert accounting transactions for their branch" ON accounting_transactions
  FOR INSERT WITH CHECK (
    branch_id IN (
      SELECT branch_id FROM employee_branches 
      WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can update accounting transactions for their branch" ON accounting_transactions
  FOR UPDATE USING (
    branch_id IN (
      SELECT branch_id FROM employee_branches 
      WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete accounting transactions for their branch" ON accounting_transactions
  FOR DELETE USING (
    branch_id IN (
      SELECT branch_id FROM employee_branches 
      WHERE employee_id = auth.uid()
    )
  );

-- Insert sample chart of accounts
INSERT INTO accounting_transactions (transaction_number, description, account_id, account_name, debit_amount, credit_amount, reference_type)
VALUES 
  ('SETUP-001', 'Chart of Accounts Setup - Cash Account', '1100', 'เงินสด', 0, 0, 'setup'),
  ('SETUP-002', 'Chart of Accounts Setup - Sales Revenue', '4100', 'รายได้จากการขาย', 0, 0, 'setup'),
  ('SETUP-003', 'Chart of Accounts Setup - VAT Payable', '2200', 'ภาษีมูลค่าเพิ่มค้างจ่าย', 0, 0, 'setup'),
  ('SETUP-004', 'Chart of Accounts Setup - Card Payment', '1110', 'เงินฝากธนาคาร', 0, 0, 'setup'),
  ('SETUP-005', 'Chart of Accounts Setup - Transfer Payment', '1120', 'เงินโอน', 0, 0, 'setup'),
  ('SETUP-006', 'Chart of Accounts Setup - Credit Sales', '1300', 'ลูกหนี้การค้า', 0, 0, 'setup')
ON CONFLICT (transaction_number) DO NOTHING;

-- Add comment
COMMENT ON TABLE accounting_transactions IS 'ตารางบันทึกรายการบัญชีสำหรับระบบ POS และการเงิน';
COMMENT ON COLUMN accounting_transactions.reference_type IS 'ประเภทของธุรกรรมต้นฉบับ: pos_sale, installment_payment, expense, invoice';
COMMENT ON COLUMN accounting_transactions.reference_id IS 'ID ของธุรกรรมต้นฉบับที่อ้างอิง';
COMMENT ON COLUMN accounting_transactions.account_id IS 'รหัสบัญชีตามแผนผังบัญชี';
COMMENT ON COLUMN accounting_transactions.debit_amount IS 'จำนวนเงินฝั่งเดบิต';
COMMENT ON COLUMN accounting_transactions.credit_amount IS 'จำนวนเงินฝั่งเครดิต';