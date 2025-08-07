# 🚀 คำแนะนำการรัน Migration (อัปเดต)

## 📋 สถานการณ์ปัจจุบัน

จากการตรวจสอบพบว่า:
- ✅ **ตารางที่มีอยู่**: customers, installment_plans, installment_contracts, installment_payments
- ❌ **ตารางที่ขาดหาย**: guarantors, contract_history, contract_documents
- ❌ **คอลัมน์ที่ขาดหายในตาราง customers**: id_card, occupation, monthly_income, workplace, work_address, emergency_contact_*
- ⚠️ **ตาราง installment_plans**: มีโครงสร้างแตกต่างจากที่คาดไว้ (ไม่มีคอลัมน์ name, months, etc.)

## 🛠️ วิธีการรัน Migration (2 ขั้นตอน)

### ขั้นตอนที่ 1: รัน Migration หลัก
1. เปิด [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจคของคุณ
3. ไปที่เมนู **SQL Editor** ทางด้านซ้าย
4. คลิก **New Query** เพื่อสร้าง query ใหม่
5. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `manual_migration.sql`
6. วางในหน้าต่าง SQL Editor และคลิก **Run**

### ขั้นตอนที่ 2: รัน Migration สำหรับ installment_plans
1. สร้าง **New Query** อีกครั้ง
2. เลือกไฟล์ที่เหมาะสม:
   - **🥇 แนะนำที่สุด**: `minimal_installment_plans_migration.sql` (เรียบง่าย แน่นอน)
   - **🥈 ทางเลือก**: `ultra_safe_installment_plans_migration.sql` (ครบถ้วน แก้ไขแล้ว)
   - **🥉 สำรอง**: `simple_installment_plans_migration.sql` (แก้ไขแล้ว)
3. คัดลอกเนื้อหาจากไฟล์ที่เลือกและวางใน SQL Editor
4. คลิก **Run**

**หมายเหตุ**: 
- จากการตรวจสอบพบว่าคอลัมน์ที่จำเป็นจริงๆ มีเพียง `plan_number` และ `total_amount`
- ไฟล์ `minimal_installment_plans_migration.sql` เป็นเวอร์ชันที่เรียบง่ายและแน่นอนที่สุด

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
รันคำสั่งนี้ในเทอร์มินัลเพื่อตรวจสอบ:
```bash
npm run check-db
```

## 📄 เนื้อหาของ Migration Script

### 1. สร้างตารางใหม่
- **guarantors** - ข้อมูลผู้ค้ำประกัน
- **contract_history** - ประวัติการเปลี่ยนแปลงสัญญา
- **contract_documents** - เอกสารแนบ

### 2. เพิ่มคอลัมน์ในตารางเดิม
- **customers** - เพิ่ม 11 คอลัมน์ใหม่
- **installment_contracts** - เพิ่ม 8 คอลัมน์ใหม่
- **installment_payments** - เพิ่ม 5 คอลัมน์ใหม่
- **installment_plans** - เพิ่ม 3 คอลัมน์ใหม่

### 3. สร้าง Indexes และ Constraints
- Indexes สำหรับการค้นหาที่เร็วขึ้น
- Foreign Key Constraints สำหรับความสัมพันธ์
- Unique Constraints สำหรับข้อมูลที่ไม่ซ้ำ

### 4. เพิ่ม Functions และ Triggers
- Function สำหรับอัปเดต `updated_at`
- Triggers สำหรับตาราง guarantors

### 5. เพิ่มข้อมูลตัวอย่าง
- แผนผ่อนชำระ 5 แผน
- ข้อมูลพื้นฐานสำหรับการทดสอบ

## ✅ ผลลัพธ์ที่คาดหวัง

หลังจากรัน migration สำเร็จ คุณจะได้:

### ตารางที่ครบถ้วน:
```
✅ customers (พร้อมคอลัมน์ใหม่ 11 คอลัมน์)
✅ guarantors (ตารางใหม่)
✅ installment_plans (พร้อมคอลัมน์ใหม่ 3 คอลัมน์)
✅ installment_contracts (พร้อมคอลัมน์ใหม่ 8 คอลัมน์)
✅ installment_payments (พร้อมคอลัมน์ใหม่ 5 คอลัมน์)
✅ contract_history (ตารางใหม่)
✅ contract_documents (ตารางใหม่)
```

### ฟีเจอร์ที่พร้อมใช้งาน:
- 🎯 Workflow การสร้างสัญญาใหม่ 5 ขั้นตอน
- 👥 ระบบจัดการผู้ค้ำประกัน
- 📊 การตรวจสอบความเสี่ยงอัตโนมัติ
- 📁 ระบบจัดการเอกสาร
- 📈 การติดตามประวัติการเปลี่ยนแปลง

## 🔧 การแก้ไขปัญหา

### ถ้า Migration ล้มเหลว:

#### 1. ตรวจสอบ Permissions
```sql
-- ตรวจสอบสิทธิ์ของ user ปัจจุบัน
SELECT current_user, session_user;
```

#### 2. รัน Migration ทีละส่วน
แทนที่จะรันทั้งหมดพร้อมกัน ให้รันทีละส่วน:

```sql
-- ส่วนที่ 1: สร้างตาราง guarantors
CREATE TABLE IF NOT EXISTS guarantors (...);

-- ส่วนที่ 2: สร้างตาราง contract_history
CREATE TABLE IF NOT EXISTS contract_history (...);

-- และต่อไป...
```

#### 3. ตรวจสอบ Error Messages
- `relation already exists` = ตารางมีอยู่แล้ว (ปกติ)
- `column already exists` = คอลัมน์มีอยู่แล้ว (ปกติ)
- `permission denied` = ไม่มีสิทธิ์ (ติดต่อ admin)

### ถ้ายังมีปัญหา:

#### ตรวจสอบโครงสร้างตาราง:
```sql
-- ดูโครงสร้างตาราง
\d guarantors
\d customers
\d installment_contracts

-- หรือใช้
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guarantors';
```

## 📞 การขอความช่วยเหลือ

ถ้ายังมีปัญหา:
1. รันคำสั่ง `npm run check-db` และส่งผลลัพธ์
2. ส่ง error message ที่ได้จาก SQL Editor
3. ระบุขั้นตอนที่ล้มเหลว

## 🎉 หลังจาก Migration สำเร็จ

1. **ทดสอบระบบ**: เปิดหน้า Installments และทดสอบสร้างสัญญาใหม่
2. **ตรวจสอบข้อมูล**: ดูว่าตารางและคอลัมน์ถูกสร้างครบถ้วน
3. **เริ่มใช้งาน**: ระบบพร้อมสำหรับการจัดการสัญญาผ่อนชำระแบบครบถ้วน

---

**หมายเหตุ**: Migration script นี้ใช้ `IF NOT EXISTS` และ `ADD COLUMN IF NOT EXISTS` ดังนั้นสามารถรันซ้ำได้โดยไม่เกิดปัญหา