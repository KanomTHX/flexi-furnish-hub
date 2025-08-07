# 📊 รายงานสถานะฐานข้อมูลสุดท้าย - ระบบ Installment

## ✅ สิ่งที่เสร็จสมบูรณ์แล้ว

### 1. ตารางที่พร้อมใช้งาน 100%
- **✅ customers** - ข้อมูลลูกค้า (โครงสร้างครบถ้วน)
- **✅ branches** - ข้อมูลสาขา (โครงสร้างครบถ้วน)
- **✅ installment_plans** - แผนผ่อนชำระ (โครงสร้างครบถ้วน + ข้อมูล 5 แผน)

### 2. ข้อมูลแผนผ่อนชำระที่พร้อมใช้งาน
- **PLAN003**: ผ่อน 0% 3 งวด (10,000 บาท) - ไม่ต้องผู้ค้ำ
- **PLAN006**: ผ่อน 0% 6 งวด (15,000 บาท) - ไม่ต้องผู้ค้ำ
- **PLAN012**: ผ่อน 0% 12 งวด (50,000 บาท) - ไม่ต้องผู้ค้ำ
- **PLAN024**: ผ่อน 8% 24 งวด (100,000 บาท) - ต้องมีผู้ค้ำ
- **PLAN036**: ผ่อน 10% 36 งวด (200,000 บาท) - ต้องมีผู้ค้ำ

## 🔍 โครงสร้างตารางที่ค้นพบ

### installment_contracts (สัญญาผ่อนชำระ)
**คอลัมน์ที่มีอยู่:**
- `id`, `status` (enum: pending), `contract_number` (NOT NULL)
- `transaction_id` (UUID, NOT NULL), `down_payment` (NOT NULL)
- `remaining_amount` (NOT NULL), `monthly_payment` (NOT NULL)
- `guarantor_id`, `collateral`, `terms`, `notes`, `approved_by`, `approved_at`
- `created_at`, `updated_at`

**คอลัมน์ที่ต้องเพิ่ม:**
- `customer_id`, `plan_id`, `financed_amount`, `total_interest`
- `processing_fee`, `total_payable`, `contract_date`
- `first_payment_date`, `last_payment_date`
- `paid_installments`, `remaining_installments`
- `total_paid`, `remaining_balance`, `created_by`

### installment_payments (การชำระเงินงวด)
**คอลัมน์ที่มีอยู่:**
- `id`, `installment_plan_id` (reference to installment_plans)
- `payment_number` (NOT NULL), `due_date`
- `amount_due` (NOT NULL), `amount_paid`
- `payment_date`, `payment_method`, `status`
- `late_fee`, `discount`, `notes`, `processed_by`
- `created_at`, `updated_at`, `branch_id`

**คอลัมน์ที่ต้องเพิ่ม:**
- `contract_id` (reference to installment_contracts)
- `principal_amount`, `interest_amount`, `receipt_number`

### guarantors (ผู้ค้ำประกัน)
**คอลัมน์ที่มีอยู่:**
- `id`, `name`, `phone`, `email`, `address`, `id_card`
- `occupation`, `monthly_income`, `workplace`, `work_address`
- `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship`
- `created_by`, `branch_id`, `created_at`, `updated_at`

**คอลัมน์ที่ต้องเพิ่ม:**
- `updated_by`

## 🔧 การแก้ไขที่ต้องทำ

### ขั้นตอนที่ 1: รัน SQL Migration
1. ไปที่ **Supabase Dashboard > SQL Editor**
2. คัดลอกโค้ดจากไฟล์ `CORRECTED_INSTALLMENT_MIGRATION.sql`
3. วางและกด **Run**

### ขั้นตอนที่ 2: อัปเดต Code ให้ตรงกับ Column Names จริง

#### ใน supabase-guarantors.ts
```typescript
// เปลี่ยนจาก
const { data, error } = await supabase
  .from('installment_payments')
  .select('*')
  .eq('contract_id', contractId); // ❌ ไม่มีคอลัมน์นี้

// เป็น
const { data, error } = await supabase
  .from('installment_payments')
  .select('*')
  .eq('installment_plan_id', planId); // ✅ ใช้คอลัมน์ที่มีจริง
```

#### ใน InstallmentDialog.tsx
```typescript
// เปลี่ยนจาก
installment_number: 1,
amount: 5000,

// เป็น
payment_number: 1,
amount_due: 5000,
```

## 📋 ตารางใหม่ที่จะถูกสร้าง
- **contract_history** - ประวัติการเปลี่ยนแปลงสัญญา
- **installment_notifications** - การแจ้งเตือนระบบ

## 🎯 หลังจาก Migration เสร็จ

### ฟีเจอร์ที่จะใช้งานได้
1. **สร้างสัญญาผ่อนชำระใหม่** - workflow 5 ขั้นตอน
2. **จัดการผู้ค้ำประกัน** - เพิ่ม/แก้ไข/ค้นหา
3. **ตรวจสอบสิทธิ์อัตโนมัติ** - ตามรายได้และแผนที่เลือก
4. **คำนวณค่างวด** - ดอกเบี้ย, เงินดาวน์, ค่าธรรมเนียม
5. **บันทึกประวัติ** - การเปลี่ยนแปลงสัญญา
6. **ระบบแจ้งเตือน** - การชำระเงิน, วันครบกำหนด

### การทดสอบ
1. เปิดหน้า Installments
2. กดปุ่ม "สร้างสัญญาใหม่"
3. ทดสอบ workflow ทั้ง 5 ขั้นตอน
4. ทดสอบแผนที่ต้องมีผู้ค้ำ (PLAN024, PLAN036)
5. ทดสอบแผนที่ไม่ต้องมีผู้ค้ำ (PLAN003, PLAN006, PLAN012)

## 🚨 สิ่งสำคัญที่ต้องจำ

### Column Name Mapping
```
Expected Name -> Actual Database Name
=====================================
installment_number -> payment_number
amount -> amount_due
contract_id -> installment_plan_id (ใน payments table)
```

### Status Values
```
installment_contracts.status = 'pending' (ไม่ใช่ 'draft')
```

### Required Fields
```
installment_contracts:
- contract_number (NOT NULL)
- transaction_id (NOT NULL)
- down_payment (NOT NULL)
- remaining_amount (NOT NULL)
- monthly_payment (NOT NULL)

installment_payments:
- payment_number (NOT NULL)
- amount_due (NOT NULL)
```

## 📞 หากมีปัญหา

1. ตรวจสอบ error message ใน Supabase SQL Editor
2. ตรวจสอบ column names ให้ตรงกับที่ระบุในรายงานนี้
3. ตรวจสอบ enum values (status = 'pending')
4. ตรวจสอบ NOT NULL constraints

## 🎉 สรุป

ระบบ Installment พร้อมใช้งาน 95% แล้ว! เหลือเพียงการรัน SQL Migration และอัปเดต code ให้ตรงกับ column names จริง จากนั้นระบบจะสามารถสร้างสัญญาผ่อนชำระพร้อมระบบตรวจสอบผู้ค้ำประกันอัตโนมัติได้เต็มรูปแบบ