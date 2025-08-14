# การใช้งาน Migration Scripts สำหรับ Supplier Billing Advanced Features

## ภาพรวม

ไฟล์ scripts เหล่านี้จะช่วยให้คุณสามารถรัน SQL migration กับ Supabase database ได้อย่างง่ายดายผ่าน PowerShell

## ไฟล์ที่สำคัญ

### Scripts
- `scripts/setup-supabase-connection.ps1` - ตรวจสอบและตั้งค่าการเชื่อมต่อ Supabase
- `scripts/run-migration.ps1` - รัน migration หลัก
- `scripts/verify-migration.ps1` - ตรวจสอบว่า migration สำเร็จหรือไม่
- `run-migration.bat` - Batch file สำหรับ Windows (ง่ายต่อการใช้งาน)

### Migration Files
- `supabase/migrations/20241214000001_supplier_billing_advanced_features.sql` - Migration หลัก
- `supabase/migrations/20241214000002_advanced_constraints_and_optimizations.sql` - Constraints และ optimizations
- `supabase/migrations/20241214000003_rollback_advanced_features.sql` - Rollback script

## วิธีการใช้งาน

### ขั้นตอนที่ 1: เตรียม Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์หลักของโปรเจค:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_PASSWORD=your-database-password-here
```

**หาข้อมูลเหล่านี้ได้จาก:**
1. เข้าไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือกโปรเจคของคุณ
3. ไปที่ Settings > API
4. คัดลอก URL และ Keys
5. สำหรับ Database Password: ไปที่ Settings > Database

### ขั้นตอนที่ 2: รันผ่าน Batch File (แนะนำ)

เปิด Command Prompt หรือ PowerShell และรัน:

```cmd
run-migration.bat
```

จะมีเมนูให้เลือก:
1. **Setup and test Supabase connection** - ตรวจสอบการเชื่อมต่อ
2. **Run migration** - รัน migration จริง
3. **Run migration (dry run)** - ทดสอบโดยไม่เปลี่ยนแปลงข้อมูล
4. **Verify migration results** - ตรวจสอบผลลัพธ์
5. **Rollback migration** - ยกเลิก migration
6. **Show environment file example** - แสดงตัวอย่าง .env file

### ขั้นตอนที่ 3: รันผ่าน PowerShell โดยตรง

#### 3.1 ตรวจสอบการเชื่อมต่อ
```powershell
.\scripts\setup-supabase-connection.ps1
```

#### 3.2 รัน Migration (Dry Run ก่อน)
```powershell
.\scripts\run-migration.ps1 -DryRun
```

#### 3.3 รัน Migration จริง
```powershell
.\scripts\run-migration.ps1
```

#### 3.4 ตรวจสอบผลลัพธ์
```powershell
.\scripts\verify-migration.ps1
```

## ตัวเลือกการใช้งาน

### สำหรับ run-migration.ps1

```powershell
# รัน migration ปกติ
.\scripts\run-migration.ps1

# ทดสอบโดยไม่เปลี่ยนแปลงข้อมูล
.\scripts\run-migration.ps1 -DryRun

# ยกเลิก migration (ลบ advanced features ทั้งหมด)
.\scripts\run-migration.ps1 -Rollback

# ระบุ connection details เอง
.\scripts\run-migration.ps1 -SupabaseUrl "https://your-project.supabase.co" -SupabasePassword "your-password"
```

### สำหรับ setup-supabase-connection.ps1

```powershell
# ตรวจสอบการตั้งค่า
.\scripts\setup-supabase-connection.ps1

# แสดงตัวอย่าง .env file
.\scripts\setup-supabase-connection.ps1 -ShowEnvExample
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. PowerShell Execution Policy
```
execution of scripts is disabled on this system
```

**วิธีแก้:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. psql ไม่พบ
```
psql : The term 'psql' is not recognized
```

**วิธีแก้:**
- ติดตั้ง PostgreSQL client tools
- หรือติดตั้ง PostgreSQL แบบเต็ม

#### 3. การเชื่อมต่อ Database ล้มเหลว
```
Database connection failed
```

**ตรวจสอบ:**
- ✅ URL ถูกต้อง (https://your-project.supabase.co)
- ✅ Password ถูกต้อง
- ✅ IP address ของคุณอยู่ใน whitelist ของ Supabase
- ✅ Project ยังใช้งานได้

#### 4. Permission Denied
```
permission denied for schema public
```

**วิธีแก้:**
- ใช้ Service Role Key แทน Anon Key
- ตรวจสอบสิทธิ์ของ database user

### การตรวจสอบ Supabase Settings

1. **ไปที่ Supabase Dashboard**
2. **Settings > Database**
3. **ตรวจสอบ Connection Info:**
   - Host: `db.your-project-id.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`

4. **Settings > API**
   - ตรวจสอบ Project URL
   - คัดลอก Service Role Key (สำหรับ migration)

## ขั้นตอนที่แนะนำ

### สำหรับการใช้งานครั้งแรก:

1. **เตรียม .env file**
   ```cmd
   run-migration.bat
   # เลือก 6 เพื่อดูตัวอย่าง .env file
   ```

2. **ตรวจสอบการเชื่อมต่อ**
   ```cmd
   run-migration.bat
   # เลือก 1
   ```

3. **ทดสอบ migration (dry run)**
   ```cmd
   run-migration.bat
   # เลือก 3
   ```

4. **รัน migration จริง**
   ```cmd
   run-migration.bat
   # เลือก 2
   ```

5. **ตรวจสอบผลลัพธ์**
   ```cmd
   run-migration.bat
   # เลือก 4
   ```

### สำหรับการ Rollback:

```cmd
run-migration.bat
# เลือก 5
# ⚠️ ระวัง: จะลบ advanced features ทั้งหมด!
```

## ผลลัพธ์ที่คาดหวัง

### เมื่อ Migration สำเร็จ:
- ✅ Tables ใหม่ 13 ตาราง
- ✅ Views ใหม่ 4 views
- ✅ Functions ใหม่หลายตัว
- ✅ Indexes และ constraints
- ✅ Sample data (templates, reports)

### เมื่อ Verification สำเร็จ:
```
🎉 All tests passed! Migration was successful!
✅ Your database is ready for advanced supplier billing features!
```

## การบำรุงรักษา

### ทำความสะอาดข้อมูลเก่า (ทุกเดือน):
```sql
SELECT cleanup_old_notification_history(90);
SELECT cleanup_old_sync_logs(30);
SELECT cleanup_old_report_history(180);
```

### อัพเดท Performance Metrics (ทุกเดือน):
```sql
SELECT calculate_supplier_performance_metrics(
    id, 
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day'
) FROM suppliers WHERE status = 'active';
```

## การสนับสนุน

หากพบปัญหา:
1. ตรวจสอบ error messages ใน PowerShell
2. ดูไฟล์ `ADVANCED_FEATURES_MIGRATION_README.md` สำหรับรายละเอียดเพิ่มเติม
3. ตรวจสอบ Supabase Dashboard สำหรับ database logs
4. ใช้ `-DryRun` เพื่อทดสอบก่อนรันจริง

## ไฟล์เอกสารที่เกี่ยวข้อง

- `docs/DATABASE_SCHEMA_ADVANCED_FEATURES.md` - รายละเอียด database schema
- `ADVANCED_FEATURES_MIGRATION_README.md` - คู่มือ migration แบบละเอียด
- `.kiro/specs/supplier-billing-advanced/` - Requirements และ design documents