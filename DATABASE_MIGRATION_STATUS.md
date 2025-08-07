# 📊 สถานะการ Migration ฐานข้อมูลระบบ Installment

## ✅ สิ่งที่เสร็จแล้ว

### 1. ตารางที่มีอยู่และพร้อมใช้งาน
- ✅ **customers** - ข้อมูลลูกค้า (โครงสร้างครบถ้วน)
- ✅ **branches** - ข้อมูลสาขา (โครงสร้างครบถ้วน)
- ✅ **installment_plans** - แผนผ่อนชำระ (โครงสร้างครบถ้วน + มีข้อมูล 5 แผน)

### 2. ข้อมูลแผนผ่อนชำระที่พร้อมใช้งาน
- **PLAN003**: ผ่อน 0% 3 งวด (ไม่ต้องผู้ค้ำ)
- **PLAN006**: ผ่อน 0% 6 งวด (ไม่ต้องผู้ค้ำ)
- **PLAN012**: ผ่อน 0% 12 งวด (ไม่ต้องผู้ค้ำ)
- **PLAN024**: ผ่อน 8% 24 งวด (ต้องมีผู้ค้ำ)
- **PLAN036**: ผ่อน 10% 36 งวด (ต้องมีผู้ค้ำ)

## ⚠️ สิ่งที่ต้องแก้ไข

### 1. ตารางที่ขาดคอลัมน์สำคัญ

#### installment_contracts (สัญญาผ่อนชำระ)
**คอลัมน์ที่ขาดหาย:**
- `customer_id` - เชื่อมโยงกับลูกค้า
- `plan_id` - เชื่อมโยงกับแผนผ่อน
- `financed_amount` - ยอดที่ผ่อน
- `total_interest` - ดอกเบี้ยรวม
- `processing_fee` - ค่าธรรมเนียม
- `total_payable` - ยอดที่ต้องชำระรวม
- `contract_date` - วันที่ทำสัญญา
- `first_payment_date` - วันชำระงวดแรก
- `last_payment_date` - วันชำระงวดสุดท้าย
- `paid_installments` - จำนวนงวดที่ชำระแล้ว
- `remaining_installments` - จำนวนงวดที่เหลือ
- `total_paid` - ยอดที่ชำระแล้ว
- `remaining_balance` - ยอดคงเหลือ
- `created_by` - ผู้สร้างสัญญา

#### installment_payments (การชำระเงินงวด)
**คอลัมน์ที่ขาดหาย:**
- `amount` - ยอดเงินงวด (สำคัญมาก)
- `paid_date` - วันที่ชำระ
- `paid_amount` - ยอดที่ชำระจริง
- `receipt_number` - เลขที่ใบเสร็จ

#### guarantors (ผู้ค้ำประกัน)
**คอลัมน์ที่ขาดหาย:**
- `updated_by` - ผู้แก้ไขข้อมูล

### 2. ตารางใหม่ที่ต้องสร้าง
- `contract_history` - ประวัติการเปลี่ยนแปลงสัญญา
- `installment_notifications` - การแจ้งเตือนระบบ

## 🔧 วิธีแก้ไข

### ขั้นตอนที่ 1: รัน SQL Migration
1. ไปที่ **Supabase Dashboard**
2. เลือก **SQL Editor**
3. คัดลอกโค้ดจากไฟล์ `FINAL_MISSING_COLUMNS_MIGRATION.sql`
4. วางและกด **Run**

### ขั้นตอนที่ 2: ตรวจสอบผลลัพธ์
รันสคริปต์ `final_verification_check.js` เพื่อตรวจสอบว่า migration สำเร็จ

## 📋 ไฟล์ที่เกี่ยวข้อง

### Migration Files
- `FINAL_MISSING_COLUMNS_MIGRATION.sql` - SQL สำหรับรันใน Supabase
- `final_working_migration.js` - สคริปต์ที่เพิ่มข้อมูล installment_plans
- `add_missing_columns_step_by_step.js` - สคริปต์ตรวจสอบคอลัมน์

### Application Files
- `src/components/installments/InstallmentDialog.tsx` - Dialog สร้างสัญญา
- `src/lib/supabase-guarantors.ts` - Functions จัดการผู้ค้ำประกัน
- `src/types/installments.ts` - Type definitions

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

## 🚨 หมายเหตุสำคัญ

- **ต้องรัน SQL Migration ก่อน** ถึงจะใช้งานระบบได้
- **ข้อมูลใน installment_plans พร้อมแล้ว** ไม่ต้องเพิ่มใหม่
- **Foreign Key Constraints** ถูก comment ไว้ เพื่อหลีกเลี่ยงปัญหา
- **Indexes** จะช่วยเพิ่มประสิทธิภาพการค้นหา

## 📞 หากมีปัญหา

1. ตรวจสอบ error message ใน Supabase SQL Editor
2. รันสคริปต์ตรวจสอบ: `node check_all_required_tables.js`
3. ดู log ใน browser console เมื่อใช้งาน InstallmentDialog