# คู่มือการตั้งค่าแผนผ่อนชำระ

## 📋 ภาพรวม

เอกสารนี้จะแนะนำวิธีการเพิ่มแผนผ่อนชำระในฐานข้อมูล สำหรับระบบ Installments ที่ต้องการแผน 3, 6, 9, 12, และ 24 เดือน

## 🎯 แผนผ่อนชำระที่จะสร้าง

| แผน | ชื่อ | งวด | ดอกเบี้ย | เงินดาวน์ | ยอดเงิน | ผู้ค้ำประกัน |
|-----|------|-----|---------|----------|---------|-------------|
| PLAN003 | ผ่อน 0% 3 เดือน | 3 | 0% | 30% | 5,000 - 30,000 | ไม่ต้อง |
| PLAN006 | ผ่อน 0% 6 เดือน | 6 | 0% | 20% | 10,000 - 50,000 | ไม่ต้อง |
| PLAN009 | ผ่อน 3% 9 เดือน | 9 | 3% | 15% | 15,000 - 80,000 | ไม่ต้อง |
| PLAN012 | ผ่อน 5% 12 เดือน | 12 | 5% | 10% | 20,000 - 150,000 | ไม่ต้อง |
| PLAN024 | ผ่อน 8% 24 เดือน | 24 | 8% | 10% | 50,000 - 300,000 | **ต้องมี** |

## 🚀 วิธีการตั้งค่า

### วิธีที่ 1: ใช้ Node.js Script (แนะนำ)

```bash
# รันสคริปต์ตั้งค่าแผนผ่อนชำระ
node setup_installment_plans.js
```

**ข้อดี:**
- ตรวจสอบการเชื่อมต่อฐานข้อมูลอัตโนมัติ
- ป้องกันการสร้างข้อมูลซ้ำ
- แสดงผลลัพธ์ที่ชัดเจน
- จัดการ error ได้ดี

### วิธีที่ 2: ใช้ SQL Script

```sql
-- รันไฟล์ SQL ในฐานข้อมูล
\i insert_installment_plans.sql
```

**หรือ copy-paste SQL commands:**

```sql
-- ลบแผนเดิม (ถ้ามี)
DELETE FROM installment_plans WHERE plan_number IN ('PLAN003', 'PLAN006', 'PLAN009', 'PLAN012', 'PLAN024');

-- เพิ่มแผนใหม่
INSERT INTO installment_plans (
    plan_number, plan_name, description, number_of_installments,
    interest_rate, down_payment_percent, processing_fee,
    min_amount, max_amount, requires_guarantor, is_active, status
) VALUES 
('PLAN003', 'ผ่อน 0% 3 เดือน', 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3, 0, 30, 200, 5000, 30000, false, true, 'active'),
('PLAN006', 'ผ่อน 0% 6 เดือน', 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 6, 0, 20, 300, 10000, 50000, false, true, 'active'),
('PLAN009', 'ผ่อน 3% 9 เดือน', 'ผ่อนชำระ 9 งวด ดอกเบี้ย 3% ต่อปี', 9, 3, 15, 400, 15000, 80000, false, true, 'active'),
('PLAN012', 'ผ่อน 5% 12 เดือน', 'ผ่อนชำระ 12 งวด ดอกเบี้ย 5% ต่อปี', 12, 5, 10, 500, 20000, 150000, false, true, 'active'),
('PLAN024', 'ผ่อน 8% 24 เดือน', 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี ต้องมีผู้ค้ำประกัน', 24, 8, 10, 1000, 50000, 300000, true, true, 'active');
```

### วิธีที่ 3: ใช้ Supabase Dashboard

1. เปิด Supabase Dashboard
2. ไปที่ Table Editor
3. เลือกตาราง `installment_plans`
4. กด "Insert" → "Insert row"
5. กรอกข้อมูลตามตารางข้างต้น

## 🔍 การตรวจสอบผลลัพธ์

### ตรวจสอบแผนที่สร้างแล้ว:

```sql
SELECT 
    plan_number,
    plan_name,
    number_of_installments,
    interest_rate,
    down_payment_percent,
    requires_guarantor,
    is_active
FROM installment_plans 
WHERE is_active = true 
ORDER BY number_of_installments;
```

### ตรวจสอบสถิติ:

```sql
SELECT 
    COUNT(*) as total_plans,
    COUNT(CASE WHEN requires_guarantor = false THEN 1 END) as no_guarantor_plans,
    COUNT(CASE WHEN requires_guarantor = true THEN 1 END) as guarantor_required_plans
FROM installment_plans 
WHERE is_active = true;
```

## 🧪 การทดสอบ

### ทดสอบการดึงข้อมูลแผน:

```bash
# รันสคริปต์ทดสอบ
node test_installment_plans_fetch.js
```

### ทดสอบใน UI:

1. เปิดหน้า Installments ในระบบ
2. กดปุ่ม "สร้างสัญญาใหม่"
3. กรอกข้อมูลลูกค้า
4. ตรวจสอบว่าแผนผ่อนชำระแสดงครบ 5 แผน

## 🚨 การแก้ไขปัญหา

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูลได้

**วิธีแก้:**
1. ตรวจสอบ environment variables:
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```
2. ตรวจสอบว่าตาราง `installment_plans` มีอยู่ในฐานข้อมูล

### ปัญหา: Error "table doesn't exist"

**วิธีแก้:**
1. รัน migration สร้างตาราง:
   ```bash
   node run_migration.js
   ```
2. หรือสร้างตารางด้วย SQL:
   ```sql
   -- ดูไฟล์ database_schema_installments.sql
   ```

### ปัญหา: แผนไม่แสดงใน UI

**วิธีแก้:**
1. ตรวจสอบว่าแผนมี `is_active = true`
2. ตรวจสอบ console ใน browser หา error
3. ตรวจสอบว่า InstallmentDialog ดึงข้อมูลจากฐานข้อมูลแล้ว

## 📊 ข้อมูลเพิ่มเติม

### โครงสร้างตาราง installment_plans:

```sql
CREATE TABLE installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_number VARCHAR(20) UNIQUE NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    description TEXT,
    number_of_installments INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    down_payment_percent DECIMAL(5,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    min_amount DECIMAL(12,2) DEFAULT 0,
    max_amount DECIMAL(12,2) DEFAULT 1000000,
    requires_guarantor BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### การใช้งานในระบบ:

1. **ลูกค้ารายได้ < 15,000 บาท**: จะต้องมีผู้ค้ำประกันทุกแผน
2. **ลูกค้ารายได้ ≥ 15,000 บาท**: 
   - แผน 3, 6, 9, 12 เดือน: ไม่ต้องมีผู้ค้ำประกัน
   - แผน 24 เดือน: ต้องมีผู้ค้ำประกัน
3. **ยอดเงิน > 100,000 บาท**: ต้องมีผู้ค้ำประกันทุกแผน
4. **ระยะเวลา > 24 งวด**: ต้องมีผู้ค้ำประกันทุกแผน

## ✅ เสร็จสิ้น

หลังจากตั้งค่าแผนผ่อนชำระเรียบร้อยแล้ว ระบบจะพร้อมใช้งานสำหรับ:
- สร้างสัญญาผ่อนชำระ
- จัดการลูกค้าและผู้ค้ำประกัน
- ติดตามการชำระเงิน
- สร้างรายงานการผ่อนชำระ

---
**วันที่สร้าง**: ${new Date().toLocaleDateString('th-TH')}
**ผู้สร้าง**: Kiro AI Assistant