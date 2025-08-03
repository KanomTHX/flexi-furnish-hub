-- Insert mock data for testing

-- Insert branches first
INSERT INTO branches (id, name, address, phone, is_active, created_at, updated_at) VALUES
('branch-001', 'สาขาหลัก - สุขุมวิท', '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110', '02-123-4567', true, NOW(), NOW()),
('branch-002', 'สาขา 2 - รัชดาภิเษก', '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', '02-234-5678', true, NOW(), NOW()),
('branch-003', 'สาขา 3 - ลาดพร้าว', '789 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900', '02-345-6789', true, NOW(), NOW());

-- Insert product categories
INSERT INTO product_categories (id, name, description, is_active, created_at) VALUES
('cat-001', 'เฟอร์นิเจอร์สำนักงาน', 'เก้าอี้ โต๊ะ และอุปกรณ์สำนักงาน', true, NOW()),
('cat-002', 'ห้องนั่งเล่น', 'โซฟา โต๊ะกาแฟ และเฟอร์นิเจอร์ห้องนั่งเล่น', true, NOW()),
('cat-003', 'ห้องนอน', 'เตียง ตู้ และเฟอร์นิเจอร์ห้องนอน', true, NOW()),
('cat-004', 'ห้องอาหาร', 'โต๊ะอาหาร เก้าอี้ และเฟอร์นิเจอร์ห้องอาหาร', true, NOW()),
('cat-005', 'ที่เก็บของ', 'ชั้นวาง ตู้เก็บของ', true, NOW());

-- Insert products
INSERT INTO products (id, name, brand, model, description, category_id, base_price, cost_price, is_active, created_at, updated_at) VALUES
('prod-001', 'เก้าอี้สำนักงานผู้บริหาร', 'OfficeComfort', 'OC-001', 'เก้าอี้สำนักงานผู้บริหารแบบเออร์โกโนมิกส์ พร้อมพนักพิงหลัง', 'cat-001', 12500, 8000, true, NOW(), NOW()),
('prod-002', 'ชุดโต๊ะอาหาร (4 เก้าอี้)', 'DiningSet', 'DT-205', 'โต๊ะอาหารไม้แท้ พร้อมเก้าอี้ 4 ตัวแบบเข้าชุด', 'cat-004', 25900, 18000, true, NOW(), NOW()),
('prod-003', 'ชั้นหนังสือพรีเมียม 5 ชั้น', 'BookShelf', 'BS-108', 'ชั้นหนังสือไม้คุณภาพสูง 5 ชั้น ปรับระดับได้', 'cat-005', 8900, 6000, true, NOW(), NOW()),
('prod-004', 'โซฟา 3 ที่นั่ง ผ้า', 'SofaFlex', 'SF-301', 'โซฟาผ้า 3 ที่นั่ง นั่งสบาย ดีไซน์โมเดิร์น', 'cat-002', 35000, 25000, true, NOW(), NOW()),
('prod-005', 'โต๊ะกาแฟหน้ากระจก', 'CoffeeTable', 'CT-150', 'โต๊ะกาแฟหน้ากระจกโมเดิร์น โครงเหล็ก', 'cat-002', 15500, 11000, true, NOW(), NOW());

-- Insert product inventory with serial numbers
INSERT INTO product_inventory (id, product_id, serial_number, branch_id, status, purchase_price, selling_price, received_date, warranty_expiry, created_at, updated_at) VALUES
-- เก้าอี้สำนักงาน
('inv-001', 'prod-001', 'OC000001', 'branch-001', 'available', 8000, 12500, '2024-01-01', '2026-01-01', NOW(), NOW()),
('inv-002', 'prod-001', 'OC000002', 'branch-001', 'available', 8000, 12500, '2024-01-01', '2026-01-01', NOW(), NOW()),
('inv-003', 'prod-001', 'OC000003', 'branch-002', 'available', 8000, 12500, '2024-01-02', '2026-01-02', NOW(), NOW()),

-- ชุดโต๊ะอาหาร
('inv-004', 'prod-002', 'DT000001', 'branch-001', 'available', 18000, 25900, '2024-01-01', '2025-01-01', NOW(), NOW()),
('inv-005', 'prod-002', 'DT000002', 'branch-001', 'available', 18000, 25900, '2024-01-01', '2025-01-01', NOW(), NOW()),

-- ชั้นหนังสือ
('inv-006', 'prod-003', 'BS000001', 'branch-001', 'available', 6000, 8900, '2024-01-05', '2025-01-05', NOW(), NOW()),
('inv-007', 'prod-003', 'BS000002', 'branch-002', 'available', 6000, 8900, '2024-01-05', '2025-01-05', NOW(), NOW()),
('inv-008', 'prod-003', 'BS000003', 'branch-003', 'available', 6000, 8900, '2024-01-05', '2025-01-05', NOW(), NOW()),

-- โซฟา
('inv-009', 'prod-004', 'SF000001', 'branch-001', 'available', 25000, 35000, '2024-01-10', '2026-01-10', NOW(), NOW()),
('inv-010', 'prod-004', 'SF000002', 'branch-002', 'available', 25000, 35000, '2024-01-10', '2026-01-10', NOW(), NOW()),

-- โต๊ะกาแฟ
('inv-011', 'prod-005', 'CT000001', 'branch-001', 'available', 11000, 15500, '2024-01-15', '2025-01-15', NOW(), NOW()),
('inv-012', 'prod-005', 'CT000002', 'branch-002', 'available', 11000, 15500, '2024-01-15', '2025-01-15', NOW(), NOW());

-- Insert departments
INSERT INTO departments (id, name, description, location, budget, is_active, created_at, updated_at) VALUES
('dept-001', 'ฝ่ายขาย', 'ฝ่ายขายและการตลาด', 'ชั้น 1', 500000, true, NOW(), NOW()),
('dept-002', 'ฝ่ายคลังสินค้า', 'ฝ่ายจัดการคลังสินค้าและโลจิสติกส์', 'ชั้น B1', 300000, true, NOW(), NOW()),
('dept-003', 'ฝ่ายบัญชี', 'ฝ่ายบัญชีและการเงิน', 'ชั้น 2', 250000, true, NOW(), NOW()),
('dept-004', 'ฝ่ายบริหาร', 'ฝ่ายบริหารและทรัพยากรบุคคล', 'ชั้น 3', 400000, true, NOW(), NOW());

-- Insert positions
INSERT INTO positions (id, name, description, level, base_salary, permissions, requirements, is_active, created_at, updated_at) VALUES
('pos-001', 'ผู้จัดการฝ่ายขาย', 'รับผิดชอบการบริหารจัดการฝ่ายขาย', 5, 45000, ARRAY['sales:manage', 'reports:view', 'employees:view'], ARRAY['ปริญญาตรี', 'ประสบการณ์ 5 ปี'], true, NOW(), NOW()),
('pos-002', 'พนักงานขาย', 'ขายสินค้าและให้บริการลูกค้า', 2, 18000, ARRAY['pos:use', 'customers:view', 'products:view'], ARRAY['มัธยมศึกษา', 'ประสบการณ์ 1 ปี'], true, NOW(), NOW()),
('pos-003', 'แคชเชียร์', 'รับชำระเงินและออกใบเสร็จ', 1, 15000, ARRAY['pos:use', 'payments:process'], ARRAY['มัธยมศึกษา'], true, NOW(), NOW()),
('pos-004', 'พนักงานคลังสินค้า', 'จัดการสินค้าในคลัง', 2, 16000, ARRAY['inventory:manage', 'stock:update'], ARRAY['มัธยมศึกษา'], true, NOW(), NOW()),
('pos-005', 'หัวหน้าคลังสินค้า', 'บริหารจัดการคลังสินค้า', 4, 35000, ARRAY['inventory:manage', 'warehouse:manage', 'reports:view'], ARRAY['ปริญญาตรี', 'ประสบการณ์ 3 ปี'], true, NOW(), NOW());

-- Insert claims
INSERT INTO claims (id, claim_number, customer_name, customer_phone, serial_number, claim_type, description, status, repair_cost, reported_date, notes, created_at, updated_at) VALUES
('claim-001', 'CLM-2024-001', 'นายสมชาย ใจดี', '081-234-5678', 'SF000001', 'defect', 'โซฟามีปัญหาเบาะยุบและเสียงดังเมื่อนั่ง อาจเป็นปัญหาจากสปริงภายใน', 'in_progress', 2500, '2024-01-15', 'ตรวจสอบแล้วพบว่าสปริงชำรุด', NOW(), NOW()),
('claim-002', 'CLM-2024-002', 'นางสาวมาลี สวยงาม', '082-345-6789', 'DT000001', 'damage', 'โต๊ะอาหารมีรอยขีดข่วนที่หน้าโต๊ะจากการขนส่ง', 'resolved', 1200, '2024-01-10', 'ซ่อมแซมเสร็จแล้ว ลูกค้าพอใจ', NOW(), NOW()),
('claim-003', 'CLM-2024-003', 'บริษัท เฟอร์นิเจอร์ดี จำกัด', '02-123-4567', 'BS000001', 'warranty', 'ชั้นหนังสือมีปัญหาชั้นโค้งงอ', 'pending', 0, '2024-01-20', 'รอการตรวจสอบ', NOW(), NOW()),
('claim-004', 'CLM-2024-004', 'นายสมชาย ใจดี', '081-234-5678', 'OC000001', 'installation', 'เก้าอี้ไม่สามารถประกอบได้ เนื่องจากขาดน็อตและสกรู', 'approved', 500, '2024-01-22', 'อนุมัติแล้ว รอจัดส่งอะไหล่', NOW(), NOW());

-- Insert sample accounting accounts
INSERT INTO accounts (id, code, name, type, category, balance, description, is_active, created_at, updated_at) VALUES
-- Assets
('acc-001', '1000', 'เงินสด', 'asset', 'current_asset', 150000, 'เงินสดในมือและเงินฝากธนาคาร', true, NOW(), NOW()),
('acc-002', '1100', 'ลูกหนี้การค้า', 'asset', 'current_asset', 85000, 'ลูกหนี้จากการขายสินค้าเครดิต', true, NOW(), NOW()),
('acc-003', '1200', 'สินค้าคงเหลือ', 'asset', 'current_asset', 320000, 'มูลค่าสินค้าคงเหลือในคลัง', true, NOW(), NOW()),
('acc-004', '1500', 'อุปกรณ์และเครื่องใช้สำนักงาน', 'asset', 'fixed_asset', 45000, 'อุปกรณ์สำนักงานและเครื่องใช้ต่างๆ', true, NOW(), NOW()),
('acc-005', '1600', 'ยานพาหนะ', 'asset', 'fixed_asset', 280000, 'รถยนต์และยานพาหนะสำหรับการขนส่ง', true, NOW(), NOW()),

-- Liabilities
('acc-006', '2000', 'เจ้าหนี้การค้า', 'liability', 'current_liability', 65000, 'เจ้าหนี้จากการซื้อสินค้าเครดิต', true, NOW(), NOW()),
('acc-007', '2100', 'ภาษีขายที่ต้องชำระ', 'liability', 'current_liability', 12000, 'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง', true, NOW(), NOW()),
('acc-008', '2200', 'เงินเดือนค้างจ่าย', 'liability', 'current_liability', 28000, 'เงินเดือนพนักงานที่ค้างจ่าย', true, NOW(), NOW()),

-- Equity
('acc-009', '3000', 'ทุนจดทะเบียน', 'equity', 'owner_equity', 500000, 'ทุนจดทะเบียนของบริษัท', true, NOW(), NOW()),
('acc-010', '3100', 'กำไรสะสม', 'equity', 'retained_earnings', 195000, 'กำไรสะสมจากการดำเนินงาน', true, NOW(), NOW()),

-- Revenue
('acc-011', '4000', 'รายได้จากการขาย', 'revenue', 'sales_revenue', 450000, 'รายได้จากการขายสินค้า', true, NOW(), NOW()),
('acc-012', '4100', 'รายได้อื่น', 'revenue', 'other_revenue', 15000, 'รายได้จากแหล่งอื่นๆ', true, NOW(), NOW()),

-- Expenses
('acc-013', '5000', 'ต้นทุนขาย', 'expense', 'cost_of_goods_sold', 270000, 'ต้นทุนสินค้าที่ขาย', true, NOW(), NOW()),
('acc-014', '6000', 'ค่าเช่า', 'expense', 'operating_expense', 24000, 'ค่าเช่าสำนักงานและคลังสินค้า', true, NOW(), NOW()),
('acc-015', '6100', 'ค่าไฟฟ้า', 'expense', 'operating_expense', 8500, 'ค่าไฟฟ้าและสาธารณูปโภค', true, NOW(), NOW()),
('acc-016', '6200', 'เงินเดือนพนักงาน', 'expense', 'operating_expense', 85000, 'เงินเดือนและค่าแรงพนักงาน', true, NOW(), NOW());

-- Insert journal entries
INSERT INTO journal_entries (id, entry_number, date, description, reference, total_debit, total_credit, status, created_by, created_at, updated_at) VALUES
('je-001', 'JE-2024-001', '2024-01-15', 'บันทึกการขายสินค้าเงินสด', 'INV-2024-001', 15000, 15000, 'approved', 'emp-001', '2024-01-15T10:00:00Z', '2024-01-15T14:30:00Z'),
('je-002', 'JE-2024-002', '2024-01-16', 'บันทึกการซื้อสินค้าเครดิต', 'PO-2024-001', 25000, 25000, 'approved', 'emp-002', '2024-01-16T09:00:00Z', '2024-01-16T16:00:00Z'),
('je-003', 'JE-2024-003', '2024-01-17', 'จ่ายค่าเช่าประจำเดือน', 'RENT-2024-01', 12000, 12000, 'pending', 'emp-003', '2024-01-17T11:00:00Z', '2024-01-17T11:00:00Z');

-- Insert journal entry lines
INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit_amount, credit_amount, reference, created_at) VALUES
-- JE-001 lines
('jel-001', 'je-001', 'acc-001', 'รับเงินสดจากการขาย', 15000, 0, 'INV-2024-001', NOW()),
('jel-002', 'je-001', 'acc-011', 'รายได้จากการขายสินค้า', 0, 15000, 'INV-2024-001', NOW()),

-- JE-002 lines
('jel-003', 'je-002', 'acc-003', 'ซื้อสินค้าเข้าคลัง', 25000, 0, 'PO-2024-001', NOW()),
('jel-004', 'je-002', 'acc-006', 'เจ้าหนี้การค้า', 0, 25000, 'PO-2024-001', NOW()),

-- JE-003 lines
('jel-005', 'je-003', 'acc-014', 'ค่าเช่าประจำเดือน มกราคม', 12000, 0, 'RENT-2024-01', NOW()),
('jel-006', 'je-003', 'acc-001', 'จ่ายเงินสดค่าเช่า', 0, 12000, 'RENT-2024-01', NOW());

-- Insert sample sales transactions
INSERT INTO sales_transactions (id, transaction_number, customer_name, customer_phone, customer_address, transaction_type, total_amount, tax_amount, discount_amount, paid_amount, payment_status, transaction_date, employee_id, branch_id, notes, created_at, updated_at) VALUES
('st-001', 'TXN-2024-001', 'นายสมชาย ใจดี', '081-234-5678', '123 ถนนสุขุมวิท กรุงเทพฯ', 'cash_sale', 15000, 1071.43, 0, 15000, 'paid', '2024-01-15T10:00:00Z', 'emp-001', 'branch-001', 'ขายเงินสด', NOW(), NOW()),
('st-002', 'TXN-2024-002', 'บริษัท ABC จำกัด', '02-123-4567', '456 ถนนพหลโยธิน กรุงเทพฯ', 'credit_sale', 25900, 1850, 0, 0, 'pending', '2024-01-16T14:00:00Z', 'emp-002', 'branch-001', 'ขายเครดิต 30 วัน', NOW(), NOW());

-- Insert sale items
INSERT INTO sale_items (id, transaction_id, product_id, serial_number, quantity, unit_price, line_total, created_at) VALUES
('si-001', 'st-001', 'prod-001', 'OC000001', 1, 12500, 12500, NOW()),
('si-002', 'st-001', 'prod-005', 'CT000001', 1, 2500, 2500, NOW()),
('si-003', 'st-002', 'prod-002', 'DT000001', 1, 25900, 25900, NOW());

-- Update product inventory status for sold items
UPDATE product_inventory SET status = 'sold' WHERE serial_number IN ('OC000001', 'CT000001', 'DT000001');

-- Insert audit logs
INSERT INTO audit_logs (id, employee_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at) VALUES
('audit-001', 'emp-001', 'CREATE', 'sales_transactions', 'st-001', NULL, '{"transaction_number": "TXN-2024-001", "customer_name": "นายสมชาย ใจดี", "total_amount": 15000}', '192.168.1.100'::inet, 'Mozilla/5.0', NOW()),
('audit-002', 'emp-002', 'UPDATE', 'product_inventory', 'inv-001', '{"status": "available"}', '{"status": "sold"}', '192.168.1.101'::inet, 'Mozilla/5.0', NOW()),
('audit-003', 'emp-003', 'CREATE', 'journal_entries', 'je-003', NULL, '{"entry_number": "JE-2024-003", "description": "จ่ายค่าเช่าประจำเดือน", "total_debit": 12000}', '192.168.1.102'::inet, 'Mozilla/5.0', NOW());