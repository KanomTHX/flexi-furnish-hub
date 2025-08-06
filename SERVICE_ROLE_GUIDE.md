# 🔑 คู่มือการใช้ Service Role Key

## 🎯 ความแตกต่างระหว่าง Anon Key และ Service Role Key

### Anon Key (Client Mode)
- ✅ ปลอดภัยสำหรับ client-side
- ❌ มีข้อจำกัดด้านสิทธิ์
- ❌ ต้องตั้งค่า RLS (Row Level Security)
- ❌ อาจไม่สามารถสร้างตารางได้

### Service Role Key (Admin Mode)
- ⚠️ มีสิทธิ์เต็มในฐานข้อมูล
- ✅ สามารถสร้าง/ลบตารางได้
- ✅ ไม่ต้องตั้งค่า RLS
- ❌ ไม่ปลอดภัยสำหรับ production

## 🔧 การตั้งค่าใน .env.local

```env
# Supabase URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Anon Key (สำหรับ client-side)
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (สำหรับ admin operations)
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# เลือกใช้ Key แบบไหน
VITE_USE_SERVICE_ROLE=true  # true = Admin Mode, false = Client Mode
```

## 🚀 วิธีการใช้งาน

### 1. เปิดใช้งาน Admin Mode
```env
# ใน .env.local
VITE_USE_SERVICE_ROLE=true
```

### 2. รีสตาร์ทเซิร์ฟเวอร์
```bash
npm run dev
```

### 3. ใช้งานผ่านหน้าเว็บ
- ไปที่หน้า "ฐานข้อมูล"
- เลือกแท็บ "Admin Mode"
- คลิก "ติดตั้งฐานข้อมูล"

### 4. ใช้งานผ่านโค้ด
```typescript
import { adminOperations } from '@/utils/supabaseAdmin'

// สร้างตาราง
await adminOperations.createTable('test_table', 'id UUID PRIMARY KEY, name TEXT')

// รัน SQL
await adminOperations.executeSQL('CREATE TABLE ...')

// ลิสต์ตาราง
const tables = await adminOperations.listTables()
```

## 🛡️ ความปลอดภัย

### ⚠️ คำเตือน
- **Service Role Key มีสิทธิ์เต็ม** - สามารถลบข้อมูลทั้งหมดได้
- **ใช้เฉพาะในการพัฒนา** - ห้ามใช้ใน production
- **เก็บไว้เป็นความลับ** - ห้าม commit ลง git

### ✅ แนวทางที่ปลอดภัย
1. **Development**: ใช้ Service Role Key เพื่อความสะดวก
2. **Production**: ใช้ Anon Key + RLS policies
3. **CI/CD**: ใช้ Service Role Key เฉพาะ migration scripts

## 🔄 การสลับโหมด

### เปลี่ยนเป็น Admin Mode
```env
VITE_USE_SERVICE_ROLE=true
```

### เปลี่ยนเป็น Client Mode
```env
VITE_USE_SERVICE_ROLE=false
```

### ตรวจสอบโหมดปัจจุบัน
- ไปที่หน้า "ทดสอบการเชื่อมต่อ"
- ดูข้อความ "Using: Service Role Key" หรือ "Using: Anon Key"

## 🧪 การทดสอบ

### ทดสอบ Admin Mode
```bash
# 1. ตั้งค่า .env.local
VITE_USE_SERVICE_ROLE=true

# 2. รีสตาร์ทเซิร์ฟเวอร์
npm run dev

# 3. ทดสอบ
# ไปที่ http://localhost:8081/test-connection
# ควรเห็น "Using: Service Role Key"
```

### ทดสอบการสร้างตาราง
```typescript
// ใน Browser Console
import { adminOperations } from '/src/utils/supabaseAdmin.ts'

// ทดสอบสร้างตาราง
adminOperations.createTable('test', 'id UUID PRIMARY KEY, name TEXT')
  .then(console.log)
```

## 📊 ฟีเจอร์ Admin Mode

### 1. การติดตั้งฐานข้อมูลอัตโนมัติ
- คลิกปุ่มเดียวติดตั้งตาราง 19 ตาราง
- ไม่ต้องใช้ SQL Editor ใน Supabase Dashboard
- แสดงผลลัพธ์แบบ real-time

### 2. การจัดการตาราง
- ดูรายชื่อตารางทั้งหมด
- ลบตารางเฉพาะ
- รีเซ็ตฐานข้อมูลทั้งหมด

### 3. รัน SQL แบบกำหนดเอง
- รันคำสั่ง SQL ใดๆ ได้
- แสดงผลลัพธ์แบบละเอียด
- Error handling ที่ดี

### 4. การตรวจสอบข้อมูล
- ดูข้อมูลในตารางต่างๆ
- นับจำนวนแถว
- ตรวจสอบ schema

## 🔮 การใช้งานขั้นสูง

### สร้าง Migration Scripts
```typescript
import { adminOperations } from '@/utils/supabaseAdmin'

const migration = `
  ALTER TABLE products ADD COLUMN barcode VARCHAR(50);
  CREATE INDEX idx_products_barcode ON products(barcode);
`

await adminOperations.executeSQL(migration)
```

### Backup และ Restore
```typescript
// Backup ข้อมูล
const backupData = await adminOperations.getTableData('products', 1000)

// Restore ข้อมูล
await adminOperations.executeSQL(`
  INSERT INTO products_backup 
  SELECT * FROM products
`)
```

### การตรวจสอบประสิทธิภาพ
```sql
-- ดู query plans
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'xxx';

-- ดู indexes
SELECT * FROM pg_indexes WHERE tablename = 'products';
```

## 🎯 สรุป

Service Role Key ช่วยให้การพัฒนาง่ายขึ้นมาก:

- ✅ **ติดตั้งฐานข้อมูลได้ในคลิกเดียว**
- ✅ **ไม่ต้องใช้ SQL Editor ใน Dashboard**
- ✅ **จัดการตารางได้แบบ real-time**
- ✅ **ทดสอบ SQL ได้ทันที**
- ✅ **Debug ปัญหาได้ง่าย**

แต่อย่าลืม:
- ⚠️ **ใช้เฉพาะในการพัฒนา**
- ⚠️ **เก็บ Key เป็นความลับ**
- ⚠️ **สลับเป็น Client Mode ใน production**

---

**🎉 ตอนนี้คุณสามารถติดตั้งฐานข้อมูลได้ในคลิกเดียว!**