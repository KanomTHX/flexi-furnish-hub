-- Alter accounting_transactions table for POS integration
-- Add columns needed for double-entry bookkeeping

-- Add account_id column for chart of accounts
ALTER TABLE accounting_transactions 
ADD COLUMN IF NOT EXISTS account_id VARCHAR(20);

-- Add account_name column
ALTER TABLE accounting_transactions 
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);

-- Add debit_amount column
ALTER TABLE accounting_transactions 
ADD COLUMN IF NOT EXISTS debit_amount DECIMAL(15,2) DEFAULT 0;

-- Add credit_amount column
ALTER TABLE accounting_transactions 
ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(15,2) DEFAULT 0;

-- Add employee_id column if not exists
ALTER TABLE accounting_transactions 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);

-- Update constraints
ALTER TABLE accounting_transactions 
DROP CONSTRAINT IF EXISTS check_debit_credit;

ALTER TABLE accounting_transactions 
ADD CONSTRAINT check_debit_credit CHECK (
  (debit_amount > 0 AND credit_amount = 0) OR 
  (debit_amount = 0 AND credit_amount > 0)
);

ALTER TABLE accounting_transactions 
DROP CONSTRAINT IF EXISTS check_amounts_positive;

ALTER TABLE accounting_transactions 
ADD CONSTRAINT check_amounts_positive CHECK (
  debit_amount >= 0 AND credit_amount >= 0
);

-- Create index for account_id if not exists
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_account ON accounting_transactions(account_id);

-- Update reference_type constraint to include pos_sale
ALTER TABLE accounting_transactions 
DROP CONSTRAINT IF EXISTS accounting_transactions_reference_type_check;

ALTER TABLE accounting_transactions 
ADD CONSTRAINT accounting_transactions_reference_type_check CHECK (
  reference_type::text = ANY (ARRAY[
    'sales'::character varying, 
    'purchase'::character varying, 
    'payment'::character varying, 
    'receipt'::character varying, 
    'adjustment'::character varying, 
    'pos_sale'::character varying,
    'installment_payment'::character varying,
    'expense'::character varying,
    'invoice'::character varying,
    'setup'::character varying,
    'other'::character varying
  ]::text[])
);

-- Insert sample chart of accounts (only if not exists)
INSERT INTO accounting_transactions (
  transaction_number, 
  transaction_date,
  description, 
  reference_type,
  account_id, 
  account_name, 
  debit_amount, 
  credit_amount,
  total_amount,
  status,
  created_by
)
SELECT 
  'SETUP-' || LPAD(ROW_NUMBER() OVER (ORDER BY account_id)::text, 3, '0'),
  CURRENT_DATE,
  'Chart of Accounts Setup - ' || account_name,
  'setup',
  account_id,
  account_name,
  0,
  0,
  0,
  'posted',
  'system'
FROM (
  VALUES 
    ('1100', 'เงินสด'),
    ('1110', 'เงินฝากธนาคาร'),
    ('1120', 'เงินโอน'),
    ('1300', 'ลูกหนี้การค้า'),
    ('2200', 'ภาษีมูลค่าเพิ่มค้างจ่าย'),
    ('4100', 'รายได้จากการขาย')
) AS chart(account_id, account_name)
WHERE NOT EXISTS (
  SELECT 1 FROM accounting_transactions 
  WHERE reference_type = 'setup' 
  AND account_id = chart.account_id
);

-- Add comments
COMMENT ON COLUMN accounting_transactions.account_id IS 'รหัสบัญชีตามแผนผังบัญชี';
COMMENT ON COLUMN accounting_transactions.account_name IS 'ชื่อบัญชี';
COMMENT ON COLUMN accounting_transactions.debit_amount IS 'จำนวนเงินฝั่งเดบิต';
COMMENT ON COLUMN accounting_transactions.credit_amount IS 'จำนวนเงินฝั่งเครดิต';