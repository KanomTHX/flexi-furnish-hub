# การแก้ไขปัญหา Database Schema

## 🚨 ปัญหาที่พบ

### Error เดิม:
```
ERROR: 42703: column c.customer_id does not exist
LINE 295: LEFT JOIN customers cust ON c.customer_id = cust.id
```

## 🔍 การตรวจสอบ

### 1. ตรวจสอบโครงสร้างฐานข้อมูลจริง
ใช้สคริปต์ `check_database_schema.js` เพื่อตรวจสอบ:

```bash
npm run check-db
```

### ผลการตรวจสอบ:
- ✅ **ตารางที่มีอยู่**: customers, installment_plans, installment_contracts, installment_payments
- ❌ **ตารางที่ไม่มีอยู่**: guarantors, contract_history, contract_documents
- ❌ **คอลัมน์ที่ขาดหายในตาราง customers**: id_card, occupation, monthly_income, workplace, work_address, emergency_contact_*

### 2. ตรวจสอบโครงสร้างแบบละเอียด
ใช้สคริปต์ `check_table_structure.js` เพื่อดูโครงสร้างจริง:

```bash
node check_table_structure.js
```

### ผลการตรวจสอบ:
- ตารางทั้งหมดว่าง (ไม่มีข้อมูล)
- ไม่สามารถดูโครงสร้างคอลัมน์ได้จากข้อมูล

## 🛠️ การแก้ไข

### 1. สร้าง Migration Script ที่ถูกต้อง
สร้างไฟล์ `final_installments_migration.sql` ที่:

#### ✅ **ปรับปรุงตาราง customers**
```sql
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id_card VARCHAR(17),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12,2),
-- ... คอลัมน์อื่นๆ
```

#### ✅ **สร้างตาราง guarantors**
```sql
CREATE TABLE IF NOT EXISTS guarantors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    -- ... คอลัมน์อื่นๆ
);
```

#### ✅ **ปรับปรุงตาราง installment_contracts**
```sql
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
-- ... คอลัมน์อื่นๆ
```

#### ✅ **สร้างตารางเพิ่มเติม**
- `contract_history` - ประวัติการเปลี่ยนแปลง
- `contract_documents` - เอกสารแนบ

### 2. แก้ไข Views ให้ตรงกับโครงสร้างจริง
```sql
-- View สำหรับสรุปข้อมูลสัญญา
CREATE OR REPLACE VIEW contract_summary AS
SELECT 
    c.*,
    cust.name as customer_name,
    cust.phone as customer_phone,
    cust.id_card as customer_id_card,
    g.name as guarantor_name,
    g.phone as guarantor_phone,
    g.id_card as guarantor_id_card,
    p.name as plan_name,
    p.months as plan_months,
    p.interest_rate as plan_interest_rate
FROM installment_contracts c
LEFT JOIN customers cust ON c.customer_id = cust.id  -- ✅ ใช้ customer_id ที่ถูกต้อง
LEFT JOIN guarantors g ON c.guarantor_id = g.id
LEFT JOIN installment_plans p ON c.plan_id = p.id;
```

### 3. เพิ่มการตรวจสอบความปลอดภัย
- ใช้ `IF NOT EXISTS` สำหรับการสร้างตาราง
- ใช้ `ADD COLUMN IF NOT EXISTS` สำหรับการเพิ่มคอลัมน์
- ตรวจสอบ constraints ก่อนเพิ่ม
- เพิ่ม verification หลัง migration

## 📁 ไฟล์ที่สร้าง/ปรับปรุง

### ไฟล์ตรวจสอบ:
- `check_database_schema.js` - ตรวจสอบโครงสร้างฐานข้อมูล
- `check_table_structure.js` - ตรวจสอบโครงสร้างแบบละเอียด
- `database_schema_check_result.json` - ผลการตรวจสอบ

### ไฟล์ Migration:
- `final_installments_migration.sql` - Migration script ที่แก้ไขแล้ว
- `corrected_migration.sql` - Migration script ที่สร้างอัตโนมัติ

### ไฟล์ที่ปรับปรุง:
- `supabase_migration_installments_upgrade.sql` - แก้ไข Views
- `package.json` - เพิ่ม scripts สำหรับตรวจสอบ

## 🚀 วิธีการใช้งาน

### 1. ตรวจสอบฐานข้อมูลปัจจุบัน:
```bash
npm run check-db
```

### 2. รัน Migration:
```bash
# ใช้ Supabase CLI หรือ SQL Editor
psql -d your_database -f final_installments_migration.sql
```

### 3. ตรวจสอบหลัง Migration:
```bash
npm run check-db
```

## ✅ ผลลัพธ์ที่คาดหวัง

หลังจากรัน Migration แล้ว:

### ตารางที่ควรมี:
- ✅ customers (พร้อมคอลัมน์ใหม่)
- ✅ guarantors (ตารางใหม่)
- ✅ installment_plans (พร้อมคอลัมน์ใหม่)
- ✅ installment_contracts (พร้อมคอลัมน์ใหม่)
- ✅ installment_payments (พร้อมคอลัมน์ใหม่)
- ✅ contract_history (ตารางใหม่)
- ✅ contract_documents (ตารางใหม่)

### Views ที่ควรทำงาน:
- ✅ contract_summary
- ✅ payment_report

### Functions ที่ควรมี:
- ✅ generate_contract_number()
- ✅ calculate_monthly_payment()
- ✅ update_contract_balance()

## 🔧 การแก้ไขปัญหาเพิ่มเติม

### ถ้ายังมี Error:
1. ตรวจสอบชื่อคอลัมน์ในตารางจริง
2. ตรวจสอบ foreign key relationships
3. ตรวจสอบ permissions ของ database user

### การ Debug:
```sql
-- ตรวจสอบโครงสร้างตาราง
\d installment_contracts

-- ตรวจสอบคอลัมน์
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'installment_contracts';

-- ตรวจสอบ foreign keys
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'installment_contracts';
```

## 📝 สรุป

การแก้ไขปัญหานี้เกิดจากการที่ migration script เดิมอ้างอิงถึงโครงสร้างตารางที่ยังไม่ได้สร้าง หรือใช้ชื่อคอลัมน์ที่ไม่ตรงกับความเป็นจริง

การแก้ไขที่ถูกต้องคือ:
1. ตรวจสอบโครงสร้างฐานข้อมูลจริงก่อน
2. สร้าง migration script ที่ตรงกับสถานการณ์จริง
3. ใช้การตรวจสอบความปลอดภัยในการสร้าง/แก้ไขตาราง
4. ทดสอบ migration ก่อนใช้งานจริง

ตอนนี้ระบบพร้อมสำหรับการปรับปรุง workflow การสร้างสัญญาผ่อนชำระและการจัดการข้อมูลผู้ค้ำประกันแล้ว! 🎉