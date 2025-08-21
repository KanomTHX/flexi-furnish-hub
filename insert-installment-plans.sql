-- ตรวจสอบโครงสร้างตาราง
\d installment_plans

-- ลบข้อมูลเดิม (ถ้ามี)
DELETE FROM installment_plans;

-- สร้างข้อมูลตัวอย่างแผนผ่อนชำระ (เป็นเทมเพลต)
-- ใช้ข้อมูลจำลองสำหรับคอลัมน์ที่จำเป็น
INSERT INTO installment_plans (
  plan_number,
  customer_id,
  sales_transaction_id,
  branch_id,
  total_amount,
  down_payment,
  installment_amount,
  number_of_installments,
  start_date,
  name, 
  months, 
  down_payment_percent, 
  interest_rate, 
  processing_fee, 
  min_amount, 
  max_amount, 
  requires_guarantor, 
  description, 
  is_active
) VALUES 
  ('PLAN001', NULL, NULL, '18ca730e-5319-4fda-a056-6559f0267bb0', 50000.00, 10000.00, 7000.00, 6, CURRENT_DATE, 'แผนผ่อน 6 เดือน', 6, 20.00, 5.00, 500.00, 10000.00, 100000.00, false, 'แผนผ่อนชำระระยะสั้น เหมาะสำหรับสินค้าราคาไม่สูง', true),
  ('PLAN002', NULL, NULL, '7729e974-be9c-4a56-8c57-412dc5461e2e', 100000.00, 15000.00, 7500.00, 12, CURRENT_DATE, 'แผนผ่อน 12 เดือน', 12, 15.00, 7.00, 800.00, 20000.00, 200000.00, false, 'แผนผ่อนชำระยอดนิยม เหมาะสำหรับเฟอร์นิเจอร์ทั่วไป', true),
  ('PLAN003', NULL, NULL, 'c959197c-95c9-40e5-be58-f4b6b7b1a1e7', 200000.00, 20000.00, 11000.00, 18, CURRENT_DATE, 'แผนผ่อน 18 เดือน', 18, 10.00, 9.00, 1200.00, 50000.00, 300000.00, true, 'แผนผ่อนชำระระยะกลาง เหมาะสำหรับเฟอร์นิเจอร์ราคาสูง', true),
  ('PLAN004', NULL, NULL, '18ca730e-5319-4fda-a056-6559f0267bb0', 300000.00, 30000.00, 12500.00, 24, CURRENT_DATE, 'แผนผ่อน 24 เดือน', 24, 10.00, 12.00, 1500.00, 100000.00, 500000.00, true, 'แผนผ่อนชำระระยะยาว เหมาะสำหรับชุดเฟอร์นิเจอร์ครบชุด', true),
  ('PLAN005', NULL, NULL, '7729e974-be9c-4a56-8c57-412dc5461e2e', 500000.00, 25000.00, 15000.00, 36, CURRENT_DATE, 'แผนผ่อน 36 เดือน', 36, 5.00, 15.00, 2000.00, 200000.00, 1000000.00, true, 'แผนผ่อนชำระระยะยาวสุด เหมาะสำหรับโครงการตกแต่งบ้านทั้งหลัง', true);

-- ตรวจสอบข้อมูลที่เพิ่มเข้าไป
SELECT plan_number, name, months, down_payment_percent, interest_rate, min_amount, max_amount, requires_guarantor, is_active 
FROM installment_plans 
ORDER BY months;