# 🚀 คู่มือการรัน SQL สำหรับ Supplier Billing

## 📋 **ขั้นตอนการรัน SQL**

### **วิธีที่ 1: ใช้ Batch Script (Windows)**
```cmd
# รันไฟล์ batch script
run-supplier-sql.bat
```

### **วิธีที่ 2: ใช้ PowerShell Script**
```powershell
# รัน PowerShell script
.\run-supplier-sql.ps1

# หรือส่ง parameters
.\run-supplier-sql.ps1 -ProjectRef "your-project-ref" -Password "your-password"
```

### **วิธีที่ 3: รันด้วย psql โดยตรง**
```cmd
# แทนที่ [PROJECT-REF] และ [PASSWORD] ด้วยข้อมูลจริง
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" -f "public\SUPPLIER_BILLING_TABLES.sql"
```

### **วิธีที่ 4: ใช้ Node.js Script**
```cmd
# สร้างและรัน Node.js script
node run-sql.js
```

## 🔑 **ข้อมูลที่ต้องการ**

### **Supabase Project Reference**
- หาได้จาก URL ของ Supabase Dashboard
- รูปแบบ: `abcdefghijklmnop` (16 ตัวอักษร)
- ตัวอย่าง: หาก URL เป็น `https://abcdefghijklmnop.supabase.co` 
- Project Ref คือ: `abcdefghijklmnop`

### **Database Password**
- รหัสผ่านที่ตั้งไว้เมื่อสร้างโปรเจกต์ Supabase
- หาได้จาก Settings > Database > Connection string
- หรือ Reset password ใหม่ใน Supabase Dashboard

## 📁 **ไฟล์ที่เตรียมไว้**

### **SQL Files**
- ✅ `public/SUPPLIER_BILLING_TABLES.sql` - SQL หลักสำหรับ Supplier Billing
- ✅ `public/CREATE_POS_SYSTEM_TABLES.sql` - SQL ครบถ้วนทั้งระบบ

### **Script Files**
- ✅ `run-supplier-sql.bat` - Batch script สำหรับ Windows
- ✅ `run-supplier-sql.ps1` - PowerShell script
- ✅ `install-psql.md` - คู่มือติดตั้ง psql

## 🛠️ **ขั้นตอนที่แนะนำ**

### **1. เตรียมข้อมูล**
```
1. หา Project Reference จาก Supabase Dashboard
2. เตรียม Database Password
3. ตรวจสอบว่ามี psql installed
```

### **2. รัน Script**
```cmd
# วิธีที่ง่ายที่สุด
run-supplier-sql.bat

# Script จะถาม:
# - Project Reference
# - Database Password
# - แล้วรัน SQL อัตโนมัติ
```

### **3. ตรวจสอบผลลัพธ์**
```
1. ดู output ใน command line
2. เปิดแอป: npm run dev
3. ไปที่ /database > แท็บ "ตรวจสอบ DB"
4. ดูว่า Completion Percentage เป็น 100%
```

## 🔍 **การตรวจสอบหลังรัน SQL**

### **ใช้ Database Inspector**
1. รันแอป: `npm run dev`
2. เปิด: `http://localhost:8080/database`
3. แท็บ "ตรวจสอบ DB"
4. คลิก "รีเฟรช"
5. ดูผลลัพธ์

### **ใช้ SQL Query**
```sql
-- ตรวจสอบตารางที่สร้างแล้ว
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('suppliers', 'supplier_invoices', 'supplier_payments');

-- ตรวจสอบ Functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%supplier%';
```

## ❗ **หากเกิดปัญหา**

### **Connection Error**
```
- ตรวจสอบ Project Reference
- ตรวจสอบ Password
- ตรวจสอบ Network Connection
```

### **Permission Error**
```
- ใช้ Database Password ที่ถูกต้อง
- ตรวจสอบ RLS Settings ใน Supabase
```

### **JWT Expired Error**
```
1. เปิดแอป: npm run dev
2. ไปที่ /database > แท็บ "JWT Auth"
3. คลิก "Refresh" หรือ "Sign In"
4. ลองรัน SQL อีกครั้ง
```

## 💡 **คำแนะนำ**

### **สำหรับความปลอดภัย**
- ไม่ควรเก็บ Password ในไฟล์
- ใช้ Environment Variables
- ตรวจสอบ Connection String ก่อนรัน

### **สำหรับการ Debug**
- เปิด Verbose mode: `psql -v ON_ERROR_STOP=1`
- ดู Log ใน Supabase Dashboard
- ใช้ Database Inspector เพื่อตรวจสอบ

## 🎯 **ผลลัพธ์ที่คาดหวัง**

หลังรัน SQL สำเร็จ คุณจะได้:
- ✅ **7 ตารางใหม่** สำหรับ Supplier Billing
- ✅ **6 Functions** สำหรับ business logic
- ✅ **1 View** สำหรับ reporting
- ✅ **Indexes และ Triggers** สำหรับประสิทธิภาพ
- ✅ **Sample Data** สำหรับ Chart of Accounts

## 🚀 **หลังรัน SQL แล้ว**

1. **ทดสอบระบบ**: เปิดแอปและไปที่หน้า Warehouses > แท็บ Billing
2. **ตรวจสอบข้อมูล**: ใช้ Database Inspector
3. **ทดสอบฟีเจอร์**: สร้างซัพพลายเออร์และใบแจ้งหนี้ทดสอบ

---

**📞 หากต้องการความช่วยเหลือ:**
- ดู error message ใน command line
- ตรวจสอบ Supabase Dashboard > Logs
- ใช้ Database Inspector เพื่อตรวจสอบสถานะ