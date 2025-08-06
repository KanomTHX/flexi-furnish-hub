# 🧪 คำแนะนำการทดสอบฐานข้อมูล

## ⚠️ ปัญหาที่พบและการแก้ไข

### ปัญหา: `ERROR: 42703: column "code" does not exist`

**สาเหตุ**: ตาราง `product_categories` ไม่มี column `code` แต่โค้ดพยายามใช้งาน

**การแก้ไข**: ✅ แก้ไขแล้วในไฟล์ SQL

## 🚀 ขั้นตอนการทดสอบใหม่

### 1. **ใช้ไฟล์ SQL ที่แก้ไขแล้ว**

มี 2 ตัวเลือก:

#### ตัวเลือก A: ใช้ไฟล์หลักที่แก้ไขแล้ว
```sql
-- ใช้ไฟล์ CREATE_POS_SYSTEM_TABLES.sql (แก้ไขแล้ว)
```

#### ตัวเลือก B: ใช้ไฟล์ที่ลบตารางเก่าก่อน (แนะนำ)
```sql
-- ใช้ไฟล์ FIXED_CREATE_POS_SYSTEM_TABLES.sql
-- ไฟล์นี้จะลบตารางเก่าก่อนสร้างใหม่
```

### 2. **ขั้นตอนการรัน SQL**

1. **เปิด Supabase Dashboard**
   - ไปที่ https://supabase.com
   - เลือกโปรเจกต์ของคุณ

2. **เปิด SQL Editor**
   - คลิก "SQL Editor" ในเมนูซ้าย
   - คลิก "New Query"

3. **รันไฟล์ SQL**
   ```sql
   -- คัดลอกเนื้อหาจาก FIXED_CREATE_POS_SYSTEM_TABLES.sql
   -- วางใน SQL Editor
   -- คลิก "Run"
   ```

4. **ตรวจสอบผลลัพธ์**
   ```sql
   -- ควรเห็นข้อความ
   "POS System tables created successfully!"
   "Total tables created: 19"
   ```

### 3. **ทดสอบการเชื่อมต่อ**

1. **รีสตาร์ทเซิร์ฟเวอร์**
   ```bash
   # หยุดเซิร์ฟเวอร์ (Ctrl+C)
   npm run dev
   ```

2. **เปิดหน้าทดสอบ**
   - ไปที่ `http://localhost:8081/test-connection`
   - คลิก "เริ่มทดสอบการเชื่อมต่อ"

3. **ผลลัพธ์ที่คาดหวัง**
   ```
   ✅ Environment Variables ผ่าน
   ✅ การเชื่อมต่อสำเร็จ
   ✅ พบตาราง 5/5 ตาราง
   ```

## 🔍 การตรวจสอบเพิ่มเติม

### ตรวจสอบตารางใน Supabase Dashboard

1. **ไปที่ Table Editor**
2. **ควรเห็นตาราง 19 ตาราง**:
   - branches ✅
   - employees ✅
   - customers ✅
   - product_categories ✅ (มี column code แล้ว)
   - products ✅
   - product_inventory ✅
   - sales_transactions ✅
   - sales_transaction_items ✅
   - warehouses ✅
   - stock_movements ✅
   - purchase_orders ✅
   - purchase_order_items ✅
   - chart_of_accounts ✅
   - journal_entries ✅
   - journal_entry_lines ✅
   - accounting_transactions ✅
   - claims ✅
   - installment_plans ✅
   - installment_payments ✅

### ตรวจสอบข้อมูลตัวอย่าง

```sql
-- ตรวจสอบสาขา
SELECT * FROM branches;

-- ตรวจสอบหมวดหมู่สินค้า (ต้องมี column code)
SELECT * FROM product_categories;

-- ตรวจสอบผังบัญชี
SELECT * FROM chart_of_accounts;
```

## 🛠️ การแก้ไขปัญหาที่อาจเกิดขึ้น

### ปัญหา 1: ตารางมีอยู่แล้ว
```
ERROR: relation "branches" already exists
```

**แก้ไข**: ใช้ไฟล์ `FIXED_CREATE_POS_SYSTEM_TABLES.sql` ที่มี `DROP TABLE` ก่อน

### ปัญหา 2: Foreign Key Error
```
ERROR: insert or update on table violates foreign key constraint
```

**แก้ไข**: ตรวจสอบลำดับการสร้างตาราง (ไฟล์ใหม่แก้ไขแล้ว)

### ปัญหา 3: Permission Denied
```
ERROR: permission denied for schema public
```

**แก้ไข**: 
1. ตรวจสอบสิทธิ์ในโปรเจกต์ Supabase
2. ใช้ SQL Editor ใน Dashboard (ไม่ใช่ external client)

## 🎯 ขั้นตอนหลังการติดตั้งสำเร็จ

### 1. ทดสอบระบบบัญชี
- ไปที่หน้า "ระบบบัญชี" ในแอป
- ทดสอบสร้างธุรกรรมใหม่
- ตรวจสอบว่าข้อมูลบันทึกลงฐานข้อมูล

### 2. ตรวจสอบการทำงาน
```javascript
// ใน Browser Console
import { testDatabaseConnection } from '/src/utils/testConnection.ts'
testDatabaseConnection().then(console.log)
```

### 3. ดูข้อมูลในฐานข้อมูล
- เปิด Supabase Dashboard
- ไปที่ Table Editor
- ตรวจสอบข้อมูลในตารางต่างๆ

## 📊 ผลลัพธ์ที่สมบูรณ์

เมื่อทุกอย่างทำงานถูกต้อง จะได้:

```
🔧 Environment Variables Check:
SUPABASE_URL: ✅ Set
SUPABASE_ANON_KEY: ✅ Set

🔍 Testing Supabase connection...
📡 Testing basic connection...
✅ Basic connection successful
📋 Checking if tables exist...
✅ Table 'branches' exists
✅ Table 'employees' exists  
✅ Table 'customers' exists
✅ Table 'products' exists
✅ Table 'accounting_transactions' exists
📊 Found 5/5 tables
📖 Testing data access...
✅ Successfully read 3 branches
```

## 🎉 เมื่อทดสอบสำเร็จ

ระบบพร้อมใช้งาน:
- ✅ ฐานข้อมูลครบถ้วน 19 ตาราง
- ✅ ข้อมูลตัวอย่างพร้อมใช้
- ✅ การเชื่อมต่อเสถียร
- ✅ ระบบบัญชีทำงานกับข้อมูลจริง

**🚀 พร้อมสำหรับการใช้งาน Production!**

---

**หมายเหตุ**: หากยังมีปัญหา ให้ดูที่ Console logs และติดต่อเพื่อขอความช่วยเหลือเพิ่มเติม