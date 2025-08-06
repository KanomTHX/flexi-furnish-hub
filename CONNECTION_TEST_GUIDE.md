# 🧪 คู่มือการทดสอบการเชื่อมต่อฐานข้อมูล

## 🎯 ขั้นตอนการทดสอบ

### 1. **ตรวจสอบไฟล์ .env.local**
```env
# ไฟล์ .env.local ต้องมีเนื้อหาแบบนี้
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. **รีสตาร์ทเซิร์ฟเวอร์**
```bash
# หยุดเซิร์ฟเวอร์ (Ctrl+C) แล้วรันใหม่
npm run dev
```

### 3. **เปิดหน้าทดสอบ**
- 🔗 `http://localhost:8081/test-connection` - หน้าทดสอบแบบละเอียด
- 🔗 `http://localhost:8081/database` - หน้าจัดการฐานข้อมูล

### 4. **คลิกปุ่มทดสอบ**
- คลิก "เริ่มทดสอบการเชื่อมต่อ"
- ดูผลลัพธ์ในหน้าเว็บ
- เปิด Developer Tools (F12) เพื่อดู Console logs

## 🔍 ผลลัพธ์ที่คาดหวัง

### ✅ กรณีสำเร็จ
```
🔧 Environment Variables Check:
SUPABASE_URL: ✅ Set
SUPABASE_ANON_KEY: ✅ Set

🔍 Testing Supabase connection...
📡 Testing basic connection...
✅ Basic connection successful
📋 Checking if tables exist...
❌ Table 'branches' not found: relation "public.branches" does not exist
❌ Table 'employees' not found: relation "public.employees" does not exist
...
📊 Found 0/5 tables
```

### ⚠️ กรณียังไม่มีตาราง
หากได้ผลลัพธ์แบบข้างบน แสดงว่า:
- ✅ การเชื่อมต่อสำเร็จ
- ❌ ยังไม่ได้รันไฟล์ SQL

**แก้ไข**: รันไฟล์ `CREATE_POS_SYSTEM_TABLES.sql` ใน Supabase SQL Editor

### ❌ กรณีไม่สำเร็จ
```
❌ Connection failed: Invalid API key
```

**แก้ไข**: ตรวจสอบ API Key ใน .env.local

## 🛠️ การแก้ไขปัญหา

### ปัญหา 1: Environment Variables ไม่ถูกต้อง
```
❌ Missing environment variables
```
**แก้ไข**:
1. ตรวจสอบไฟล์ .env.local
2. ใช้ `VITE_` prefix (ไม่ใช่ `NEXT_PUBLIC_`)
3. รีสตาร์ทเซิร์ฟเวอร์

### ปัญหา 2: ไม่สามารถเชื่อมต่อได้
```
❌ Connection failed: Failed to fetch
```
**แก้ไข**:
1. ตรวจสอบ Supabase URL
2. ตรวจสอบ Internet connection
3. ตรวจสอบว่าโปรเจกต์ Supabase ยังทำงานอยู่

### ปัญหา 3: ไม่พบตาราง
```
✅ Connection successful but no tables found
```
**แก้ไข**:
1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. รันไฟล์ CREATE_POS_SYSTEM_TABLES.sql

### ปัญหา 4: Permission Denied
```
❌ Permission denied for relation "branches"
```
**แก้ไข**:
1. ตรวจสอบ RLS (Row Level Security) policies
2. ใช้ anon key ที่ถูกต้อง
3. ตรวจสอบการตั้งค่าใน Supabase Dashboard

## 📊 ตัวอย่างผลลัพธ์ที่สมบูรณ์

เมื่อทุกอย่างทำงานถูกต้อง จะได้ผลลัพธ์แบบนี้:

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
✅ Successfully read 2 branches
```

## 🎉 เมื่อทดสอบสำเร็จแล้ว

หลังจากการทดสอบสำเร็จ คุณสามารถ:

1. **ใช้งานระบบบัญชี** - ไปที่หน้า "ระบบบัญชี"
2. **สร้างธุรกรรมใหม่** - ทดสอบการบันทึกข้อมูล
3. **ดูรายงาน** - ตรวจสอบข้อมูลจากฐานข้อมูลจริง
4. **พัฒนาต่อ** - เชื่อมต่อระบบอื่นๆ กับฐานข้อมูล

## 🔧 เครื่องมือเพิ่มเติม

### Browser Developer Tools
- เปิด F12
- ไปที่ Console tab
- ดู Network tab สำหรับ API calls

### Supabase Dashboard
- Table Editor - ดูข้อมูลในตาราง
- SQL Editor - รันคำสั่ง SQL
- API Logs - ดู API calls
- Authentication - จัดการผู้ใช้

### การ Debug
```javascript
// เพิ่มใน Console เพื่อทดสอบ
import { testDatabaseConnection } from '/src/utils/testConnection.ts'
testDatabaseConnection().then(console.log)
```

---

**หมายเหตุ**: หากยังมีปัญหา ให้ดูที่ Console logs และ Network tab ใน Developer Tools เพื่อหาสาเหตุที่แท้จริง