# Supabase Connection Manager

## ภาพรวม

ฟีเจอร์ Supabase Connection Manager เป็นตัวช่วยจัดการการเชื่อมต่อกับ Supabase ในหน้าการตั้งค่าระบบ ซึ่งช่วยให้ผู้ดูแลระบบสามารถ:

- ตรวจสอบสถานะการเชื่อมต่อกับ Supabase
- กำหนดค่าการเชื่อมต่อพื้นฐาน
- จัดการการตั้งค่าการยืนยันตัวตน
- ควบคุมการตั้งค่า Realtime
- ทดสอบการเชื่อมต่อแบบเรียลไทม์

## ฟีเจอร์หลัก

### 1. การตรวจสอบสถานะการเชื่อมต่อ
- แสดงสถานะการเชื่อมต่อแบบเรียลไทม์
- ปุ่มทดสอบการเชื่อมต่อ
- แสดงเวลาทดสอบล่าสุด
- ไอคอนแสดงสถานะ (เชื่อมต่อ/ไม่เชื่อมต่อ/มีข้อผิดพลาด)

### 2. การตั้งค่าพื้นฐาน
- เปิด/ปิดการใช้งาน Supabase
- กำหนด URL ของ Supabase
- ตั้งค่า Anonymous Key
- ตั้งค่า Service Role Key (ไม่บังคับ)

### 3. การตั้งค่าการยืนยันตัวตน
- รีเฟรชโทเค็นอัตโนมัติ
- เก็บเซสชันไว้
- เลือกที่เก็บข้อมูล (Local Storage, Session Storage, Memory)
- โหมด Debug

### 4. การตั้งค่า Realtime
- เปิด/ปิดการใช้งาน Realtime
- กำหนด Events ต่อวินาที

### 5. ข้อมูลการเชื่อมต่อ
- แสดงข้อมูลการตั้งค่าปัจจุบัน
- ซ่อนข้อมูลที่สำคัญ (แสดงเฉพาะส่วนต้น)

## การใช้งาน

### การเข้าถึง
1. ไปที่หน้าการตั้งค่าระบบ
2. คลิกปุ่ม "ตั้งค่าระบบ"
3. เลือกแท็บ "Supabase"

### การทดสอบการเชื่อมต่อ
1. ตรวจสอบให้แน่ใจว่าได้กรอก URL และ Anonymous Key
2. คลิกปุ่ม "ทดสอบการเชื่อมต่อ"
3. รอผลการทดสอบ

### การตั้งค่า
1. เปิดใช้งาน Supabase
2. กรอก URL และ Keys ที่จำเป็น
3. กำหนดค่าการตั้งค่าอื่นๆ ตามต้องการ
4. คลิก "บันทึก"

## โครงสร้างข้อมูล

```typescript
interface SupabaseConfig {
  enabled: boolean;
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  autoRefreshToken: boolean;
  persistSession: boolean;
  storage: 'localStorage' | 'sessionStorage' | 'memory';
  debug: boolean;
  realtime: {
    enabled: boolean;
    params: {
      eventsPerSecond: number;
    };
  };
}
```

## การทดสอบการเชื่อมต่อ

ระบบจะทดสอบการเชื่อมต่อโดย:

1. **การตรวจสอบ URL และ Key**: ตรวจสอบว่า URL และ Anonymous Key ถูกต้อง
2. **การทดสอบ Authentication**: ทดสอบการเชื่อมต่อกับ Supabase Auth
3. **การทดสอบ Database**: ทดสอบการเชื่อมต่อกับฐานข้อมูล
4. **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดที่ชัดเจน

## ความปลอดภัย

- **การซ่อนข้อมูลสำคัญ**: Keys จะถูกซ่อนและแสดงเฉพาะส่วนต้น
- **การตรวจสอบความถูกต้อง**: ตรวจสอบข้อมูลก่อนบันทึก
- **การจัดการข้อผิดพลาด**: แสดงข้อผิดพลาดที่ปลอดภัย

## การตั้งค่าเริ่มต้น

```typescript
{
  enabled: true,
  url: 'https://hartshwcchbsnmbrjdyn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  serviceRoleKey: '',
  autoRefreshToken: true,
  persistSession: true,
  storage: 'localStorage',
  debug: false,
  realtime: {
    enabled: true,
    params: {
      eventsPerSecond: 10
    }
  }
}
```

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **การเชื่อมต่อล้มเหลว**
   - ตรวจสอบ URL และ Key
   - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
   - ตรวจสอบสิทธิ์การเข้าถึง

2. **การทดสอบล้มเหลว**
   - ตรวจสอบว่า Supabase Project เปิดใช้งาน
   - ตรวจสอบ RLS (Row Level Security) settings
   - ตรวจสอบ API keys

3. **Realtime ไม่ทำงาน**
   - ตรวจสอบการตั้งค่า Realtime
   - ตรวจสอบ Events per second
   - ตรวจสอบการเชื่อมต่อ WebSocket

## การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต

1. **การจัดการหลาย Supabase Projects**
2. **การสำรองข้อมูลการตั้งค่า**
3. **การแสดงสถิติการใช้งาน**
4. **การแจ้งเตือนเมื่อการเชื่อมต่อมีปัญหา**
5. **การจัดการ Environment Variables**

## การติดตั้ง

ฟีเจอร์นี้รวมอยู่ในระบบแล้ว ไม่ต้องติดตั้งเพิ่มเติม เพียงแค่:

1. ตรวจสอบว่า `@supabase/supabase-js` ติดตั้งแล้ว
2. ตรวจสอบการตั้งค่าใน `src/integrations/supabase/client.ts`
3. เริ่มใช้งานผ่านหน้าการตั้งค่าระบบ

## การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:

1. ตรวจสอบ Console สำหรับข้อผิดพลาด
2. ตรวจสอบ Network tab ใน Developer Tools
3. ตรวจสอบการตั้งค่า Supabase Project
4. ติดต่อทีมพัฒนา 