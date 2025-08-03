-- Insert mock data for installment contracts and payments (with correct enum values)

-- First, let's get some existing data for references
WITH branch_data AS (
  SELECT id, name FROM branches LIMIT 1
),
-- Insert installment sales transactions first
installment_transactions AS (
  INSERT INTO sales_transactions (
    id, transaction_number, customer_name, customer_phone, customer_address, 
    transaction_type, total_amount, tax_amount, discount_amount, paid_amount, 
    payment_status, transaction_date, employee_id, branch_id, notes, 
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid() as id,
    'TXN-INS-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as transaction_number,
    customer_data.name,
    customer_data.phone,
    customer_data.address,
    'installment'::transaction_type,
    customer_data.total_amount,
    ROUND(customer_data.total_amount * 0.07, 2) as tax_amount,
    customer_data.discount,
    customer_data.down_payment,
    'partial'::payment_status,
    customer_data.transaction_date,
    gen_random_uuid(), -- employee_id placeholder
    b.id as branch_id,
    customer_data.notes,
    NOW(),
    NOW()
  FROM (VALUES
    ('นายสมชาย รวยเร็ว', '081-111-2222', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', 35000, 0, 10000, '2024-01-15'::date, 'ซื้อโซฟาผ่อน 12 เดือน'),
    ('นางสาวมาลี ชอบช้อป', '082-333-4444', '456 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพฯ 10400', 25900, 1000, 5000, '2024-01-20'::date, 'ซื้อชุดโต๊ะอาหารผ่อน 18 เดือน'),
    ('นายประชา ประหยัด', '083-555-6666', '789 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', 28000, 2000, 8000, '2024-02-01'::date, 'ซื้อเฟอร์นิเจอร์หลายชิ้นผ่อน 24 เดือน'),
    ('บริษัท ออฟฟิศเซ็ต จำกัด', '02-777-8888', '321 ถนนวิภาวดี แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', 50000, 5000, 15000, '2024-02-10'::date, 'ซื้อเฟอร์นิเจอร์สำนักงานผ่อน 36 เดือน'),
    ('นางสุดา สบายดี', '084-999-0000', '654 ถนนลาดพร้าว แขวงลาดพร้าว เขตวังทองหลาง กรุงเทพฯ 10310', 42000, 0, 12000, '2024-02-15'::date, 'ซื้อห้องนอนเซตผ่อน 30 เดือน')
  ) AS customer_data(name, phone, address, total_amount, discount, down_payment, transaction_date, notes)
  CROSS JOIN branch_data b
  RETURNING id, transaction_number, customer_name, total_amount, paid_amount, transaction_date
),
-- Insert installment contracts
contract_inserts AS (
  INSERT INTO installment_contracts (
    id, contract_number, transaction_id, start_date, end_date, total_months, 
    monthly_payment, down_payment, remaining_amount, interest_rate, status, 
    created_at, updated_at
  )
  SELECT 
    gen_random_uuid(),
    'CNT-' || SUBSTRING(t.transaction_number FROM 9) as contract_number,
    t.id,
    t.transaction_date,
    CASE 
      WHEN t.customer_name = 'นายสมชาย รวยเร็ว' THEN t.transaction_date + INTERVAL '12 months'
      WHEN t.customer_name = 'นางสาวมาลี ชอบช้อป' THEN t.transaction_date + INTERVAL '18 months'
      WHEN t.customer_name = 'นายประชา ประหยัด' THEN t.transaction_date + INTERVAL '24 months'
      WHEN t.customer_name = 'บริษัท ออฟฟิศเซ็ต จำกัด' THEN t.transaction_date + INTERVAL '36 months'
      ELSE t.transaction_date + INTERVAL '30 months'
    END as end_date,
    CASE 
      WHEN t.customer_name = 'นายสมชาย รวยเร็ว' THEN 12
      WHEN t.customer_name = 'นางสาวมาลี ชอบช้อป' THEN 18
      WHEN t.customer_name = 'นายประชา ประหยัด' THEN 24
      WHEN t.customer_name = 'บริษัท ออฟฟิศเซ็ต จำกัด' THEN 36
      ELSE 30
    END as total_months,
    CASE 
      WHEN t.customer_name = 'นายสมชาย รวยเร็ว' THEN ROUND((t.total_amount - t.paid_amount) * 1.12 / 12, 2)
      WHEN t.customer_name = 'นางสาวมาลี ชอบช้อป' THEN ROUND((t.total_amount - t.paid_amount) * 1.15 / 18, 2)
      WHEN t.customer_name = 'นายประชา ประหยัด' THEN ROUND((t.total_amount - t.paid_amount) * 1.18 / 24, 2)
      WHEN t.customer_name = 'บริษัท ออฟฟิศเซ็ต จำกัด' THEN ROUND((t.total_amount - t.paid_amount) * 1.24 / 36, 2)
      ELSE ROUND((t.total_amount - t.paid_amount) * 1.20 / 30, 2)
    END as monthly_payment,
    t.paid_amount as down_payment,
    CASE 
      WHEN t.customer_name = 'นายสมชาย รวยเร็ว' THEN ROUND((t.total_amount - t.paid_amount) * 1.12, 2)
      WHEN t.customer_name = 'นางสาวมาลี ชอบช้อป' THEN ROUND((t.total_amount - t.paid_amount) * 1.15, 2)
      WHEN t.customer_name = 'นายประชา ประหยัด' THEN ROUND((t.total_amount - t.paid_amount) * 1.18, 2)
      WHEN t.customer_name = 'บริษัท ออฟฟิศเซ็ต จำกัด' THEN ROUND((t.total_amount - t.paid_amount) * 1.24, 2)
      ELSE ROUND((t.total_amount - t.paid_amount) * 1.20, 2)
    END as remaining_amount,
    CASE 
      WHEN t.customer_name = 'นายสมชาย รวยเร็ว' THEN 12.0
      WHEN t.customer_name = 'นางสาวมาลี ชอบช้อป' THEN 15.0
      WHEN t.customer_name = 'นายประชา ประหยัด' THEN 18.0
      WHEN t.customer_name = 'บริษัท ออฟฟิศเซ็ต จำกัด' THEN 24.0
      ELSE 20.0
    END as interest_rate,
    'active'::payment_status,
    NOW(),
    NOW()
  FROM installment_transactions t
  RETURNING id, contract_number, total_months, monthly_payment, start_date
)
-- Create payment schedule for each contract
INSERT INTO installment_payments (
  id, contract_id, payment_number, due_date, amount_due, amount_paid, 
  payment_date, late_fee, status, notes, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  c.id,
  payment_month,
  c.start_date + (payment_month || ' months')::interval,
  c.monthly_payment,
  CASE 
    -- Simulate some payments made, some pending, some overdue
    WHEN payment_month <= 2 THEN c.monthly_payment -- First 2 payments paid
    WHEN payment_month = 3 AND random() > 0.5 THEN c.monthly_payment -- 50% chance 3rd payment made
    WHEN payment_month = 4 AND (c.start_date + (payment_month || ' months')::interval) < CURRENT_DATE THEN 0 -- Overdue
    ELSE 0 -- Future payments
  END as amount_paid,
  CASE 
    WHEN payment_month <= 2 THEN c.start_date + (payment_month || ' months')::interval
    WHEN payment_month = 3 AND random() > 0.5 THEN c.start_date + (payment_month || ' months')::interval + INTERVAL '5 days'
    ELSE NULL
  END as payment_date,
  CASE 
    WHEN payment_month = 4 AND (c.start_date + (payment_month || ' months')::interval) < CURRENT_DATE THEN 200 -- Late fee for overdue
    ELSE 0
  END as late_fee,
  CASE 
    WHEN payment_month <= 2 THEN 'paid'::payment_status
    WHEN payment_month = 3 AND random() > 0.5 THEN 'paid'::payment_status
    WHEN payment_month = 4 AND (c.start_date + (payment_month || ' months')::interval) < CURRENT_DATE THEN 'overdue'::payment_status
    ELSE 'pending'::payment_status
  END as status,
  CASE 
    WHEN payment_month <= 2 THEN 'ชำระเรียบร้อยแล้ว'
    WHEN payment_month = 3 AND random() > 0.5 THEN 'ชำระล่าช้า 5 วัน'
    WHEN payment_month = 4 AND (c.start_date + (payment_month || ' months')::interval) < CURRENT_DATE THEN 'ค้างชำระ มีค่าปรับ'
    ELSE 'รอการชำระ'
  END as notes,
  NOW(),
  NOW()
FROM contract_inserts c
CROSS JOIN generate_series(1, c.total_months) AS payment_month;