# Database Management Feature

## ภาพรวม

ฟีเจอร์ Database Management เป็นเครื่องมือที่ครอบคลุมสำหรับการจัดการฐานข้อมูล Supabase ที่รวมเอาเครื่องมือต่างๆ ไว้ในที่เดียว เพื่อให้ผู้ใช้สามารถจัดการโครงสร้าง ข้อมูล และความปลอดภัยของฐานข้อมูลได้อย่างมีประสิทธิภาพ

## ฟีเจอร์หลัก

### 1. Database Schema Manager (ตัวจัดการโครงสร้างฐานข้อมูล)

#### คุณสมบัติ:
- **Table Explorer**: ดูรายการตารางทั้งหมดพร้อมข้อมูลขนาด, จำนวนแถว, และวันที่แก้ไขล่าสุด
- **Schema Visualization**: แสดงความสัมพันธ์ระหว่างตารางด้วย ER Diagram
- **Column Management**: จัดการคอลัมน์ (เพิ่ม, แก้ไข, ลบ, เปลี่ยนประเภทข้อมูล)
- **Index Management**: จัดการดัชนีเพื่อเพิ่มประสิทธิภาพการค้นหา
- **Constraint Management**: จัดการ Foreign Keys, Primary Keys, และ Check Constraints

#### ฟังก์ชัน:
- สร้างตารางใหม่ด้วย UI ที่ใช้งานง่าย
- แก้ไขโครงสร้างตารางที่มีอยู่
- ดูรายละเอียดตารางแบบครบถ้วน
- สร้าง SQL Preview สำหรับการเปลี่ยนแปลง

### 2. Data Management Tools (เครื่องมือจัดการข้อมูล)

#### คุณสมบัติ:
- **Bulk Data Operations**: นำเข้า/ส่งออกข้อมูลจำนวนมาก (CSV, JSON, Excel)
- **Data Validation**: ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
- **Data Migration**: เครื่องมือสำหรับย้ายข้อมูลระหว่างตาราง
- **Backup & Restore**: สร้างและกู้คืนข้อมูลจาก Backup
- **Data Archiving**: จัดเก็บข้อมูลเก่าในตารางแยก

#### ฟังก์ชัน:
- นำเข้าข้อมูลจากไฟล์ต่างๆ
- ส่งออกข้อมูลในรูปแบบต่างๆ
- ค้นหาและกรองข้อมูล
- ตรวจสอบความถูกต้องของข้อมูล
- สร้างและกู้คืน Backup

### 3. Real-time Monitoring (การติดตามแบบเรียลไทม์)

#### คุณสมบัติ:
- **Query Performance Monitor**: ติดตามประสิทธิภาพการทำงานของ Query
- **Connection Pool Monitor**: ตรวจสอบการใช้งาน Connection Pool
- **Storage Usage Monitor**: ติดตามการใช้พื้นที่จัดเก็บข้อมูล
- **Active Sessions Monitor**: ดู Session ที่กำลังใช้งานอยู่

#### ฟังก์ชัน:
- แสดงสถิติการใช้งานแบบเรียลไทม์
- ติดตามประสิทธิภาพของ Query
- แจ้งเตือนเมื่อมีปัญหา
- แสดงแนวโน้มการใช้งาน

### 4. Security Manager (ตัวจัดการความปลอดภัย)

#### คุณสมบัติ:
- **Row Level Security (RLS) Manager**: จัดการนโยบายความปลอดภัยระดับแถว
- **Column Level Security**: กำหนดสิทธิ์การเข้าถึงระดับคอลัมน์
- **User Role Management**: จัดการบทบาทและสิทธิ์ของผู้ใช้
- **Audit Trail**: บันทึกการเปลี่ยนแปลงทั้งหมดในฐานข้อมูล
- **Encryption Manager**: จัดการการเข้ารหัสข้อมูล

#### ฟังก์ชัน:
- สร้างและจัดการนโยบาย RLS
- กำหนดสิทธิ์การเข้าถึง
- บันทึก Audit Logs
- จัดการการเข้ารหัสข้อมูล

## การใช้งาน

### การเข้าถึง
1. ไปที่เมนู "ฐานข้อมูล" ใน Sidebar
2. เลือกแท็บที่ต้องการใช้งาน

### การสร้างตารางใหม่
1. คลิกปุ่ม "สร้างตารางใหม่"
2. กำหนดชื่อตาราง
3. เพิ่มคอลัมน์และกำหนดคุณสมบัติ
4. ดู SQL Preview
5. คลิก "สร้างตาราง"

### การนำเข้าข้อมูล
1. ไปที่แท็บ "ข้อมูล"
2. เลือกตารางที่ต้องการนำเข้าข้อมูล
3. คลิก "เลือกไฟล์"
4. เลือกไฟล์ CSV, Excel หรือ JSON
5. ตรวจสอบข้อมูลและคลิก "นำเข้า"

### การจัดการความปลอดภัย
1. ไปที่แท็บ "ความปลอดภัย"
2. เปิด/ปิดการใช้งาน RLS
3. สร้างนโยบายความปลอดภัย
4. ตรวจสอบ Audit Logs

## โครงสร้างไฟล์

```
src/
├── pages/
│   └── Database.tsx                 # หน้าหลัก Database Management
├── components/
│   └── database/
│       ├── DatabaseSchemaManager.tsx # ตัวจัดการโครงสร้างฐานข้อมูล
│       ├── DataManagementTools.tsx   # เครื่องมือจัดการข้อมูล
│       ├── RealTimeMonitor.tsx       # การติดตามแบบเรียลไทม์
│       ├── SecurityManager.tsx       # ตัวจัดการความปลอดภัย
│       ├── CreateTableDialog.tsx     # Dialog สร้างตารางใหม่
│       ├── EditTableDialog.tsx       # Dialog แก้ไขตาราง
│       └── TableDetailsDialog.tsx    # Dialog รายละเอียดตาราง
├── hooks/
│   └── useDatabase.ts               # Hook สำหรับจัดการฐานข้อมูล
└── types/
    └── database.ts                  # Type definitions
```

## Type Definitions

### TableInfo
```typescript
interface TableInfo {
  name: string;
  schema: string;
  size: string;
  rows: number;
  accessCount: number;
  lastAccessed: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}
```

### ColumnInfo
```typescript
interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
}
```

### DatabaseStats
```typescript
interface DatabaseStats {
  totalTables: number;
  totalSize: string;
  totalRows: number;
  activeConnections: number;
  performanceScore: number;
  newTablesThisMonth: number;
}
```

## การตั้งค่า

### Supabase Configuration
```typescript
// ต้องตั้งค่าใน localStorage หรือ environment variables
localStorage.setItem('supabase_url', 'your-supabase-url');
localStorage.setItem('supabase_anon_key', 'your-supabase-anon-key');
```

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## การพัฒนาต่อ

### ฟีเจอร์ที่วางแผนไว้:
1. **SQL Editor**: ตัวแก้ไข SQL พร้อม Syntax Highlighting
2. **Query Builder**: สร้าง Query แบบ Visual
3. **Schema Version Control**: ติดตามการเปลี่ยนแปลงโครงสร้างฐานข้อมูล
4. **Performance Analytics**: วิเคราะห์ประสิทธิภาพของฐานข้อมูล
5. **Backup Automation**: ระบบสำรองข้อมูลอัตโนมัติ
6. **Data Migration Tools**: เครื่องมือย้ายข้อมูลขั้นสูง
7. **API Documentation Generator**: สร้างเอกสาร API อัตโนมัติ
8. **Multi-language Support**: รองรับหลายภาษา

### การปรับปรุงประสิทธิภาพ:
1. **Caching**: ใช้ React Query สำหรับ caching ข้อมูล
2. **Lazy Loading**: โหลดข้อมูลตามต้องการ
3. **Virtual Scrolling**: สำหรับตารางข้อมูลจำนวนมาก
4. **WebSocket**: สำหรับการอัปเดตแบบเรียลไทม์

## การทดสอบ

### Unit Tests
```bash
npm run test:database
```

### Integration Tests
```bash
npm run test:integration:database
```

### E2E Tests
```bash
npm run test:e2e:database
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:
1. **การเชื่อมต่อล้มเหลว**: ตรวจสอบ Supabase URL และ Key
2. **สิทธิ์ไม่เพียงพอ**: ตรวจสอบ RLS Policies
3. **ข้อมูลไม่แสดง**: ตรวจสอบการตั้งค่า Supabase Client
4. **Performance Issues**: ตรวจสอบ Indexes และ Query Optimization

### การ Debug:
```typescript
// เปิด Debug Mode
localStorage.setItem('database_debug', 'true');

// ดู Logs ใน Console
console.log('Database Debug:', debugInfo);
```

## การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ Console Logs
2. ดู Network Tab ใน Developer Tools
3. ตรวจสอบ Supabase Dashboard
4. ติดต่อทีมพัฒนา

## License

MIT License - ดูรายละเอียดในไฟล์ LICENSE 