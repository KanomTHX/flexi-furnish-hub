-- Insert mock data for testing (with correct enum values)

-- Insert branches first
INSERT INTO branches (id, name, address, phone, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'สาขาหลัก - สุขุมวิท', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '02-123-4567', true, NOW(), NOW()),
(gen_random_uuid(), 'สาขา 2 - รัชดาภิเษก', '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', '02-234-5678', true, NOW(), NOW()),
(gen_random_uuid(), 'สาขา 3 - ลาดพร้าว', '789 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', '02-345-6789', true, NOW(), NOW());

-- Insert product categories
INSERT INTO product_categories (id, name, description, is_active, created_at) VALUES
(gen_random_uuid(), 'เฟอร์นิเจอร์สำนักงาน', 'เก้าอี้ โต๊ะ และอุปกรณ์สำนักงาน', true, NOW()),
(gen_random_uuid(), 'ห้องนั่งเล่น', 'โซฟา โต๊ะกาแฟ และเฟอร์นิเจอร์ห้องนั่งเล่น', true, NOW()),
(gen_random_uuid(), 'ห้องนอน', 'เตียง ตู้ และเฟอร์นิเจอร์ห้องนอน', true, NOW()),
(gen_random_uuid(), 'ห้องอาหาร', 'โต๊ะอาหาร เก้าอี้ และเฟอร์นิเจอร์ห้องอาหาร', true, NOW()),
(gen_random_uuid(), 'ที่เก็บของ', 'ชั้นวาง ตู้เก็บของ', true, NOW());

-- Insert sample products with correct category references
WITH first_branch AS (
  SELECT id FROM branches ORDER BY created_at LIMIT 1
),
office_category AS (
  SELECT id FROM product_categories WHERE name = 'เฟอร์นิเจอร์สำนักงาน' LIMIT 1
),
dining_category AS (
  SELECT id FROM product_categories WHERE name = 'ห้องอาหาร' LIMIT 1
),
storage_category AS (
  SELECT id FROM product_categories WHERE name = 'ที่เก็บของ' LIMIT 1
),
living_category AS (
  SELECT id FROM product_categories WHERE name = 'ห้องนั่งเล่น' LIMIT 1
)
INSERT INTO products (id, name, brand, model, description, category_id, base_price, cost_price, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'เก้าอี้สำนักงานผู้บริหาร',
  'OfficeComfort',
  'OC-001',
  'เก้าอี้สำนักงานผู้บริหารแบบเออร์โกโนมิกส์ พร้อมพนักพิงหลัง',
  office_category.id,
  12500,
  8000,
  true,
  NOW(),
  NOW()
FROM office_category
UNION ALL
SELECT 
  gen_random_uuid(),
  'ชุดโต๊ะอาหาร (4 เก้าอี้)',
  'DiningSet',
  'DT-205',
  'โต๊ะอาหารไม้แท้ พร้อมเก้าอี้ 4 ตัวแบบเข้าชุด',
  dining_category.id,
  25900,
  18000,
  true,
  NOW(),
  NOW()
FROM dining_category
UNION ALL
SELECT 
  gen_random_uuid(),
  'ชั้นหนังสือพรีเมียม 5 ชั้น',
  'BookShelf',
  'BS-108',
  'ชั้นหนังสือไม้คุณภาพสูง 5 ชั้น ปรับระดับได้',
  storage_category.id,
  8900,
  6000,
  true,
  NOW(),
  NOW()
FROM storage_category
UNION ALL
SELECT 
  gen_random_uuid(),
  'โซฟา 3 ที่นั่ง ผ้า',
  'SofaFlex',
  'SF-301',
  'โซฟาผ้า 3 ที่นั่ง นั่งสบาย ดีไซน์โมเดิร์น',
  living_category.id,
  35000,
  25000,
  true,
  NOW(),
  NOW()
FROM living_category
UNION ALL
SELECT 
  gen_random_uuid(),
  'โต๊ะกาแฟหน้ากระจก',
  'CoffeeTable',
  'CT-150',
  'โต๊ะกาแฟหน้ากระจกโมเดิร์น โครงเหล็ก',
  living_category.id,
  15500,
  11000,
  true,
  NOW(),
  NOW()
FROM living_category;

-- Insert departments
INSERT INTO departments (id, name, description, location, budget, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'ฝ่ายขาย', 'ฝ่ายขายและการตลาด', 'ชั้น 1', 500000, true, NOW(), NOW()),
(gen_random_uuid(), 'ฝ่ายคลังสินค้า', 'ฝ่ายจัดการคลังสินค้าและโลจิสติกส์', 'ชั้น B1', 300000, true, NOW(), NOW()),
(gen_random_uuid(), 'ฝ่ายบัญชี', 'ฝ่ายบัญชีและการเงิน', 'ชั้น 2', 250000, true, NOW(), NOW()),
(gen_random_uuid(), 'ฝ่ายบริหาร', 'ฝ่ายบริหารและทรัพยากรบุคคล', 'ชั้น 3', 400000, true, NOW(), NOW());

-- Insert positions
INSERT INTO positions (id, name, description, level, base_salary, permissions, requirements, is_active, created_at, updated_at) VALUES
(gen_random_uuid(), 'ผู้จัดการฝ่ายขาย', 'รับผิดชอบการบริหารจัดการฝ่ายขาย', 5, 45000, ARRAY['sales:manage', 'reports:view', 'employees:view'], ARRAY['ปริญญาตรี', 'ประสบการณ์ 5 ปี'], true, NOW(), NOW()),
(gen_random_uuid(), 'พนักงานขาย', 'ขายสินค้าและให้บริการลูกค้า', 2, 18000, ARRAY['pos:use', 'customers:view', 'products:view'], ARRAY['มัธยมศึกษา', 'ประสบการณ์ 1 ปี'], true, NOW(), NOW()),
(gen_random_uuid(), 'แคชเชียร์', 'รับชำระเงินและออกใบเสร็จ', 1, 15000, ARRAY['pos:use', 'payments:process'], ARRAY['มัธยมศึกษา'], true, NOW(), NOW()),
(gen_random_uuid(), 'พนักงานคลังสินค้า', 'จัดการสินค้าในคลัง', 2, 16000, ARRAY['inventory:manage', 'stock:update'], ARRAY['มัธยมศึกษา'], true, NOW(), NOW()),
(gen_random_uuid(), 'หัวหน้าคลังสินค้า', 'บริหารจัดการคลังสินค้า', 4, 35000, ARRAY['inventory:manage', 'warehouse:manage', 'reports:view'], ARRAY['ปริญญาตรี', 'ประสบการณ์ 3 ปี'], true, NOW(), NOW());

-- Insert sample accounting accounts
INSERT INTO accounts (id, code, name, type, category, balance, description, is_active, created_at, updated_at) VALUES
-- Assets
(gen_random_uuid(), '1000', 'เงินสด', 'asset', 'current_asset', 150000, 'เงินสดในมือและเงินฝากธนาคาร', true, NOW(), NOW()),
(gen_random_uuid(), '1100', 'ลูกหนี้การค้า', 'asset', 'current_asset', 85000, 'ลูกหนี้จากการขายสินค้าเครดิต', true, NOW(), NOW()),
(gen_random_uuid(), '1200', 'สินค้าคงเหลือ', 'asset', 'current_asset', 320000, 'มูลค่าสินค้าคงเหลือในคลัง', true, NOW(), NOW()),
(gen_random_uuid(), '1500', 'อุปกรณ์และเครื่องใช้สำนักงาน', 'asset', 'fixed_asset', 45000, 'อุปกรณ์สำนักงานและเครื่องใช้ต่างๆ', true, NOW(), NOW()),
(gen_random_uuid(), '1600', 'ยานพาหนะ', 'asset', 'fixed_asset', 280000, 'รถยนต์และยานพาหนะสำหรับการขนส่ง', true, NOW(), NOW()),
-- Liabilities
(gen_random_uuid(), '2000', 'เจ้าหนี้การค้า', 'liability', 'current_liability', 65000, 'เจ้าหนี้จากการซื้อสินค้าเครดิต', true, NOW(), NOW()),
(gen_random_uuid(), '2100', 'ภาษีขายที่ต้องชำระ', 'liability', 'current_liability', 12000, 'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง', true, NOW(), NOW()),
(gen_random_uuid(), '2200', 'เงินเดือนค้างจ่าย', 'liability', 'current_liability', 28000, 'เงินเดือนพนักงานที่ค้างจ่าย', true, NOW(), NOW()),
-- Equity
(gen_random_uuid(), '3000', 'ทุนจดทะเบียน', 'equity', 'owner_equity', 500000, 'ทุนจดทะเบียนของบริษัท', true, NOW(), NOW()),
(gen_random_uuid(), '3100', 'กำไรสะสม', 'equity', 'retained_earnings', 195000, 'กำไรสะสมจากการดำเนินงาน', true, NOW(), NOW()),
-- Revenue
(gen_random_uuid(), '4000', 'รายได้จากการขาย', 'revenue', 'sales_revenue', 450000, 'รายได้จากการขายสินค้า', true, NOW(), NOW()),
(gen_random_uuid(), '4100', 'รายได้อื่น', 'revenue', 'other_revenue', 15000, 'รายได้จากแหล่งอื่นๆ', true, NOW(), NOW()),
-- Expenses
(gen_random_uuid(), '5000', 'ต้นทุนขาย', 'expense', 'cost_of_goods_sold', 270000, 'ต้นทุนสินค้าที่ขาย', true, NOW(), NOW()),
(gen_random_uuid(), '6000', 'ค่าเช่า', 'expense', 'operating_expense', 24000, 'ค่าเช่าสำนักงานและคลังสินค้า', true, NOW(), NOW()),
(gen_random_uuid(), '6100', 'ค่าไฟฟ้า', 'expense', 'operating_expense', 8500, 'ค่าไฟฟ้าและสาธารณูปโภค', true, NOW(), NOW()),
(gen_random_uuid(), '6200', 'เงินเดือนพนักงาน', 'expense', 'operating_expense', 85000, 'เงินเดือนและค่าแรงพนักงาน', true, NOW(), NOW());

-- Insert sample claims with correct status values
INSERT INTO claims (id, claim_number, customer_name, customer_phone, serial_number, claim_type, description, status, repair_cost, reported_date, notes, created_at, updated_at) VALUES
(gen_random_uuid(), 'CLM-2024-001', 'นายสมชาย ใจดี', '081-234-5678', 'SF001234', 'defect', 'โซฟามีปัญหาเบาะยุบและเสียงดังเมื่อนั่ง อาจเป็นปัญหาจากสปริงภายใน', 'in_repair', 2500, '2024-01-15', 'ตรวจสอบแล้วพบว่าสปริงชำรุด', NOW(), NOW()),
(gen_random_uuid(), 'CLM-2024-002', 'นางสาวมาลี สวยงาม', '082-345-6789', 'DT001234', 'damage', 'โต๊ะอาหารมีรอยขีดข่วนที่หน้าโต๊ะจากการขนส่ง', 'resolved', 1200, '2024-01-10', 'ซ่อมแซมเสร็จแล้ว ลูกค้าพอใจ', NOW(), NOW()),
(gen_random_uuid(), 'CLM-2024-003', 'บริษัท เฟอร์นิเจอร์ดี จำกัด', '02-123-4567', 'BS001234', 'warranty', 'ชั้นหนังสือมีปัญหาชั้นโค้งงอ', 'pending', 0, '2024-01-20', 'รอการตรวจสอบ', NOW(), NOW()),
(gen_random_uuid(), 'CLM-2024-004', 'นายสมชาย ใจดี', '081-234-5678', 'OC001234', 'installation', 'เก้าอี้ไม่สามารถประกอบได้ เนื่องจากขาดน็อตและสกรู', 'pending', 500, '2024-01-22', 'อนุมัติแล้ว รอจัดส่งอะไหล่', NOW(), NOW());