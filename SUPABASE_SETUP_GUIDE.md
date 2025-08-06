# คู่มือการติดตั้งฐานข้อมูลใน Supabase

## 🎯 ขั้นตอนการติดตั้ง

### 1. เข้าสู่ Supabase Dashboard
1. ไปที่ [https://supabase.com](https://supabase.com)
2. เข้าสู่ระบบด้วยบัญชีของคุณ
3. เลือกโปรเจกต์ที่ต้องการ

### 2. เปิด SQL Editor
1. คลิกที่ "SQL Editor" ในเมนูด้านซ้าย
2. คลิก "New Query" เพื่อสร้าง query ใหม่

### 3. รันไฟล์ SQL
1. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `CREATE_POS_SYSTEM_TABLES.sql`
2. วางในหน้า SQL Editor
3. คลิก "Run" เพื่อรันคำสั่ง

### 4. ตรวจสอบผลลัพธ์
```sql
-- ดูตารางที่สร้างแล้ว
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 5. ตรวจสอบข้อมูลตัวอย่าง
```sql
-- ตรวจสอบข้อมูลในตารางสำคัญ
SELECT * FROM branches;
SELECT * FROM product_categories;
SELECT * FROM chart_of_accounts;
```

## 📊 ตารางที่จะถูกสร้าง (19 ตาราง)

### ตารางหลัก
- `branches` - ข้อมูลสาขา
- `employees` - ข้อมูลพนักงาน

### ระบบ POS
- `customers` - ข้อมูลลูกค้า
- `product_categories` - หมวดหมู่สินค้า
- `products` - ข้อมูลสินค้า
- `product_inventory` - สต็อกสินค้าแต่ละสาขา
- `sales_transactions` - ธุรกรรมการขาย
- `sales_transaction_items` - รายการสินค้าในการขาย

### ระบบคลังสินค้า
- `warehouses` - ข้อมูลคลัง
- `stock_movements` - การเคลื่อนไหวสต็อก
- `purchase_orders` - ใบสั่งซื้อ
- `purchase_order_items` - รายการสินค้าในใบสั่งซื้อ

### ระบบบัญชี
- `chart_of_accounts` - ผังบัญชี
- `journal_entries` - รายการบัญชี
- `journal_entry_lines` - รายการย่อยของบัญชี
- `accounting_transactions` - ธุรกรรมบัญชี

### ระบบเคลม
- `claims` - ข้อมูลเคลม

### ระบบผ่อนชำระ
- `installment_plans` - แผนผ่อนชำระ
- `installment_payments` - การชำระผ่อน

## ✅ หลังจากรัน SQL สำเร็จ

ระบบจะพร้อมใช้งาน:
- ✅ ฐานข้อมูลครบถ้วน
- ✅ ข้อมูลตัวอย่างพื้นฐาน
- ✅ Indexes สำหรับประสิทธิภาพ
- ✅ Triggers สำหรับ auto-update
- ✅ Constraints สำหรับความถูกต้อง

## 🔧 การแก้ไขปัญหาที่อาจเกิดขึ้น

### ปัญหา: Permission Denied
**แก้ไข**: ตรวจสอบว่าบัญชีมีสิทธิ์ในการสร้างตาราง

### ปัญหา: Table Already Exists
**แก้ไข**: ใช้ `DROP TABLE IF EXISTS` ก่อนสร้างใหม่

### ปัญหา: Foreign Key Error
**แก้ไข**: ตรวจสอบลำดับการสร้างตาราง

## 🚀 ขั้นตอนต่อไป

หลังจากติดตั้งฐานข้อมูลแล้ว:
1. **เชื่อมต่อแอปพลิเคชัน**: อัปเดต connection string
2. **ทดสอบการเชื่อมต่อ**: ตรวจสอบการทำงาน
3. **ปรับแต่งข้อมูล**: เพิ่มข้อมูลจริงตามความต้องการ
4. **ตั้งค่า Security**: กำหนด RLS policies