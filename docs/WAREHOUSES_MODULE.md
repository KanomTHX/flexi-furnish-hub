# Warehouse Management Module

## ภาพรวม
Warehouse Management Module เป็นระบบจัดการคลังสินค้าแบบครบวงจร สำหรับร้านเฟอร์นิเจอร์ รองรับการจัดการคลังหลายแห่ง การโอนย้ายสินค้า การมอบหมายงาน และการแจ้งเตือนแบบ real-time

## ฟีเจอร์หลัก

### 🏢 การจัดการคลังสินค้า
- จัดการคลังสินค้าหลายแห่ง
- ติดตามการใช้งานพื้นที่แบบ real-time
- จัดการโซนและชั้นวางสินค้า
- ระบบจัดการพนักงานและกะการทำงาน
- ติดตามสิ่งอำนวยความสะดวก

### 🚚 การโอนย้ายสินค้า
- สร้างคำขอโอนย้ายระหว่างคลัง
- ติดตามสถานะการขนส่ง
- จัดการเอกสารและการอนุมัติ
- ระบบติดตามพัสดุ
- การรับสินค้าและตรวจสอบ

### 📋 การจัดการงาน
- มอบหมายงานให้พนักงาน
- ติดตามความคืบหน้า
- จัดการลำดับความสำคัญ
- ประเมินประสิทธิภาพ
- รายงานการทำงาน

### 🚨 ระบบแจ้งเตือน
- แจ้งเตือนความจุเต็ม
- ติดตามอุณหภูมิและความชื้น
- แจ้งเตือนอุปกรณ์ขัดข้อง
- ระบบรักษาความปลอดภัย
- การแจ้งเตือนแบบ real-time

## โครงสร้างไฟล์

```
src/
├── pages/
│   └── Warehouses.tsx               # หน้าหลัก Warehouse Management
├── components/warehouses/
│   ├── WarehouseOverview.tsx        # ภาพรวมคลังสินค้า
│   ├── WarehouseList.tsx            # รายการคลังสินค้า
│   └── TransferManagement.tsx       # จัดการการโอนย้าย
├── hooks/
│   └── useWarehouses.ts             # จัดการ state คลังสินค้า
├── types/
│   └── warehouse.ts                 # TypeScript types
├── data/
│   └── mockWarehouseData.ts         # ข้อมูลตัวอย่าง
└── utils/
    └── warehouseHelpers.ts          # ฟังก์ชันช่วย
```## การใ
ช้งาน

### 1. ภาพรวมคลังสินค้า
- ดูสรุปข้อมูลคลังทั้งหมด
- ติดตามการใช้งานพื้นที่
- ดูประสิทธิภาพคลัง
- ตรวจสอบแจ้งเตือนล่าสุด

### 2. จัดการคลังสินค้า
- ดูรายการคลังทั้งหมด
- ค้นหาและกรองคลัง
- ดูรายละเอียดคลัง
- จัดการข้อมูลคลัง

### 3. การโอนย้ายสินค้า
- สร้างคำขอโอนย้าย
- อนุมัติการโอนย้าย
- ติดตามการขนส่ง
- รับสินค้าและตรวจสอบ

### 4. การจัดการงาน
- มอบหมายงานใหม่
- ติดตามความคืบหน้า
- อัพเดทสถานะงาน
- ประเมินประสิทธิภาพ

## ประเภทคลังสินค้า

### คลังหลัก (Main Warehouse)
- คลังสินค้าหลักของบริษัท
- ความจุสูงสุด
- ครบครันสิ่งอำนวยความสะดวก
- เป็นศูนย์กลางการกระจายสินค้า

### คลังสาขา (Branch Warehouse)
- คลังสินค้าประจำสาขา
- รองรับการขายในพื้นที่
- เชื่อมต่อกับคลังหลัก
- ขนาดกลาง

### ศูนย์กระจายสินค้า (Distribution Center)
- จุดกระจายสินค้าไปยังสาขา
- ระบบขนส่งที่ทันสมัย
- การจัดการสินค้าขนาดใหญ่
- ประสิทธิภาพสูง

### คลังร้านค้า (Retail Warehouse)
- คลังสินค้าในร้านค้า
- รองรับการขายหน้าร้าน
- ขนาดเล็ก
- เข้าถึงง่าย

### คลังชั่วคราว (Temporary Warehouse)
- ใช้งานชั่วคราว
- รองรับความต้องการพิเศษ
- ยืดหยุ่นในการใช้งาน
- ต้นทุนต่ำ

## สถานะคลังสินค้า

### ใช้งาน (Active)
- คลังที่ใช้งานปกติ
- พร้อมรับ-ส่งสินค้า
- มีพนักงานประจำ
- ระบบทำงานปกติ

### ไม่ใช้งาน (Inactive)
- คลังที่หยุดใช้งานชั่วคราว
- ไม่มีการเคลื่อนไหวสินค้า
- อาจมีสินค้าคงเหลือ
- รอการเปิดใช้งาน

### ซ่อมแซม (Maintenance)
- คลังที่อยู่ระหว่างซ่อมแซม
- หยุดการทำงานชั่วคราว
- มีการปรับปรุงระบบ
- กำหนดเวลาเปิดใหม่

### ปิด (Closed)
- คลังที่ปิดถาวร
- ไม่มีการใช้งาน
- โอนสินค้าออกหมดแล้ว
- ยกเลิกการดำเนินการ

## การโอนย้ายสินค้า

### สถานะการโอนย้าย

#### ร่าง (Draft)
- คำขอที่ยังไม่ได้ส่ง
- สามารถแก้ไขได้
- รอการตรวจสอบ
- ยังไม่มีผลกระทบต่อสต็อก

#### รอดำเนินการ (Pending)
- คำขอที่ได้รับการอนุมัติ
- รอการจัดเตรียมสินค้า
- กำหนดวันที่ส่ง
- เริ่มกระบวนการโอนย้าย

#### กำลังขนส่ง (In Transit)
- สินค้าอยู่ระหว่างขนส่ง
- มีเลขติดตามพัสดุ
- ติดตามสถานะได้
- รอการรับสินค้า

#### ส่งแล้ว (Delivered)
- สินค้าถึงปลายทางแล้ว
- ตรวจสอบและรับสินค้าแล้ว
- อัพเดทสต็อกแล้ว
- การโอนย้ายเสร็จสิ้น

#### ยกเลิก (Cancelled)
- ยกเลิกการโอนย้าย
- ไม่มีการเคลื่อนไหวสินค้า
- บันทึกเหตุผลการยกเลิก
- คืนสถานะเดิม

### ระดับความสำคัญ

#### ต่ำ (Low)
- ไม่เร่งด่วน
- ส่งตามกำหนดปกติ
- ไม่มีผลกระทบต่อการขาย
- ประหยัดต้นทุน

#### ปกติ (Normal)
- ความสำคัญปานกลาง
- ส่งตามแผนที่กำหนด
- การดำเนินการมาตรฐาน
- สมดุลระหว่างเวลาและต้นทุน

#### สูง (High)
- ความสำคัญสูง
- เร่งการดำเนินการ
- อาจส่งผลต่อการขาย
- ให้ความสำคัญเป็นพิเศษ

#### ด่วนมาก (Urgent)
- เร่งด่วนที่สุด
- ดำเนินการทันที
- ส่งผลกระทบสูงหากล่าช้า
- ใช้ทรัพยากรพิเศษ

## การจัดการงาน

### ประเภทงาน

#### รับสินค้า (Receiving)
- รับสินค้าจากผู้จัดจำหน่าย
- ตรวจสอบคุณภาพและจำนวน
- บันทึกเข้าระบบ
- จัดเก็บในตำแหน่งที่เหมาะสม

#### จัดเตรียมสินค้า (Picking)
- เก็บสินค้าตามใบสั่ง
- ตรวจสอบความถูกต้อง
- จัดเรียงตามลำดับ
- เตรียมส่งมอบ

#### แพ็คสินค้า (Packing)
- บรรจุสินค้าให้เหมาะสม
- ป้องกันความเสียหาย
- ติดป้ายและเอกสาร
- เตรียมส่งออก

#### ส่งสินค้า (Shipping)
- จัดส่งสินค้าออกจากคลัง
- ประสานงานกับขนส่ง
- ติดตามการส่งมอบ
- บันทึกการออกสินค้า

#### ตรวจนับ (Counting)
- ตรวจนับสต็อกประจำงวด
- เปรียบเทียบกับระบบ
- บันทึกผลต่างที่พบ
- ปรับปรุงข้อมูล

#### ซ่อมแซม (Maintenance)
- ซ่อมแซมอุปกรณ์
- บำรุงรักษาเครื่องจักร
- ตรวจสอบระบบ
- ป้องกันปัญหา

#### ทำความสะอาด (Cleaning)
- ทำความสะอาดคลัง
- จัดระเบียบพื้นที่
- รักษาสุขอนามัย
- สร้างสภาพแวดล้อมที่ดี

#### ตรวจสอบ (Inspection)
- ตรวจสอบความปลอดภัย
- ประเมินคุณภาพ
- ตรวจสอบระบบ
- รายงานผลการตรวจสอบ

### สถานะงาน

#### รอดำเนินการ (Pending)
- งานที่ได้รับมอบหมายแล้ว
- รอการเริ่มทำงาน
- อยู่ในคิวงาน
- พร้อมดำเนินการ

#### กำลังดำเนินการ (In Progress)
- งานที่กำลังทำอยู่
- มีความคืบหน้า
- ติดตามได้
- อยู่ระหว่างดำเนินการ

#### เสร็จสิ้น (Completed)
- งานที่เสร็จแล้ว
- ผ่านการตรวจสอบ
- บันทึกผลงาน
- ปิดงานแล้ว

#### ยกเลิก (Cancelled)
- งานที่ถูกยกเลิก
- ไม่ได้ดำเนินการ
- บันทึกเหตุผล
- ปิดงานแล้ว

#### พักงาน (On Hold)
- งานที่หยุดชั่วคราว
- รอข้อมูลเพิ่มเติม
- มีปัญหาขัดข้อง
- จะกลับมาทำต่อ

## ระบบแจ้งเตือน

### ประเภทการแจ้งเตือน

#### ความจุ (Capacity)
- การใช้งานพื้นที่เกิน 80%
- พื้นที่เก็บเต็ม
- ต้องจัดการสต็อก
- วางแผนขยายพื้นที่

#### อุณหภูมิ (Temperature)
- อุณหภูมิเกินกำหนด
- ระบบทำความเย็นขัดข้อง
- สินค้าเสี่ยงเสียหาย
- ต้องแก้ไขด่วน

#### ความชื้น (Humidity)
- ความชื้นสูงเกินไป
- เสี่ยงต่อการเสียหาย
- ระบบควบคุมขัดข้อง
- ต้องปรับสภาพแวดล้อม

#### ความปลอดภัย (Security)
- การเข้าออกผิดปกติ
- ระบบรักษาความปลอดภัยขัดข้อง
- พบกิจกรรมน่าสงสัย
- ต้องตรวจสอบด่วน

#### อุปกรณ์ (Equipment)
- เครื่องจักรขัดข้อง
- ต้องซ่อมแซม
- ส่งผลต่อการทำงาน
- จัดหาอุปกรณ์สำรอง

#### การบำรุงรักษา (Maintenance)
- ถึงกำหนดบำรุงรักษา
- ต้องตรวจสอบอุปกรณ์
- ป้องกันปัญหา
- วางแผนการซ่อมแซม

### ระดับความรุนแรง

#### ข้อมูล (Info)
- การแจ้งเตือนทั่วไป
- ไม่เร่งด่วน
- เพื่อทราบ
- ไม่ส่งผลกระทบ

#### คำเตือน (Warning)
- ควรให้ความสำคัญ
- อาจส่งผลกระทบ
- ต้องติดตาม
- วางแผนแก้ไข

#### ข้อผิดพลาด (Error)
- มีปัญหาเกิดขึ้น
- ส่งผลกระทบต่อการทำงาน
- ต้องแก้ไขเร็ว
- อาจหยุดการทำงาน

#### วิกฤต (Critical)
- ปัญหาร้ายแรง
- หยุดการทำงานทันที
- ต้องแก้ไขด่วน
- ส่งผลกระทบสูง

## การส่งออกข้อมูล

### รายงานคลังสินค้า
- รหัสคลัง, ชื่อคลัง, ประเภท
- สถานะ, จังหวัด, ผู้จัดการ
- พื้นที่รวม, ความจุ, การใช้งาน
- จำนวนพนักงาน

### รายงานการโอนย้าย
- เลขที่โอนย้าย, คลังต้นทาง-ปลายทาง
- สถานะ, ความสำคัญ, จำนวนรายการ
- มูลค่ารวม, วันที่ต่างๆ
- เหตุผล, ผู้สร้าง

### รายงานงาน
- ประเภทงาน, หัวข้อ, คำอธิบาย
- ความสำคัญ, สถานะ, ผู้รับผิดชอบ
- เวลาที่ประมาณ-ใช้จริง
- วันที่กำหนด-เสร็จ

## การพัฒนาต่อ

### ฟีเจอร์ที่ควรเพิ่ม
- [ ] เชื่อมต่อกับฐานข้อมูล Supabase
- [ ] ระบบ WMS (Warehouse Management System) แบบเต็ม
- [ ] การจัดการ Batch และ Serial Number
- [ ] ระบบ RFID และ IoT Sensors
- [ ] การพยากรณ์ความต้องการพื้นที่
- [ ] ระบบจัดการเส้นทางขนส่ง
- [ ] การวิเคราะห์ประสิทธิภาพขั้นสูง
- [ ] Mobile app สำหรับพนักงานคลัง
- [ ] การเชื่อมต่อกับระบบ ERP
- [ ] ระบบ Voice Picking

### การเชื่อมต่อฐานข้อมูล
สร้าง tables ใน Supabase:

```sql
-- Warehouses table
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('main', 'branch', 'distribution', 'retail', 'temporary')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
  
  -- Address
  street TEXT NOT NULL,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'ประเทศไทย',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Contact
  manager_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  emergency_contact TEXT,
  
  -- Capacity
  total_area DECIMAL(10,2) NOT NULL,
  usable_area DECIMAL(10,2) NOT NULL,
  storage_capacity INTEGER NOT NULL,
  current_utilization INTEGER DEFAULT 0,
  utilization_percentage INTEGER GENERATED ALWAYS AS (
    CASE WHEN storage_capacity > 0 
    THEN ROUND((current_utilization::DECIMAL / storage_capacity) * 100)
    ELSE 0 END
  ) STORED,
  
  -- Facilities
  has_loading BOOLEAN DEFAULT false,
  has_unloading BOOLEAN DEFAULT false,
  has_cold_storage BOOLEAN DEFAULT false,
  has_security_system BOOLEAN DEFAULT false,
  has_fire_safety BOOLEAN DEFAULT false,
  has_climate_control BOOLEAN DEFAULT false,
  parking_spaces INTEGER DEFAULT 0,
  loading_docks INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Warehouse zones table
CREATE TABLE warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receiving', 'storage', 'picking', 'packing', 'shipping', 'returns', 'quarantine', 'office')),
  description TEXT,
  area DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL,
  current_stock INTEGER DEFAULT 0,
  utilization_percentage INTEGER GENERATED ALWAYS AS (
    CASE WHEN capacity > 0 
    THEN ROUND((current_stock::DECIMAL / capacity) * 100)
    ELSE 0 END
  ) STORED,
  
  -- Environmental controls
  temp_min DECIMAL(5,2),
  temp_max DECIMAL(5,2),
  temp_current DECIMAL(5,2),
  humidity_min DECIMAL(5,2),
  humidity_max DECIMAL(5,2),
  humidity_current DECIMAL(5,2),
  
  -- Restrictions
  max_weight DECIMAL(10,2) DEFAULT 1000,
  max_height DECIMAL(5,2) DEFAULT 3,
  hazardous_allowed BOOLEAN DEFAULT false,
  fragile_only BOOLEAN DEFAULT false,
  climate_controlled BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(warehouse_id, code)
);

-- Warehouse staff table
CREATE TABLE warehouse_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('manager', 'supervisor', 'forklift_operator', 'picker', 'packer', 'receiver', 'security', 'maintenance')),
  department TEXT NOT NULL CHECK (department IN ('operations', 'receiving', 'shipping', 'inventory', 'maintenance', 'security', 'administration')),
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night', 'rotating')),
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Warehouse transfers table
CREATE TABLE warehouse_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE NOT NULL,
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'in_transit', 'delivered', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  total_items INTEGER NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  
  requested_date DATE NOT NULL,
  scheduled_date DATE,
  shipped_date DATE,
  delivered_date DATE,
  estimated_delivery TIMESTAMP,
  
  -- Carrier info
  carrier_name TEXT,
  tracking_number TEXT,
  carrier_contact TEXT,
  
  reason TEXT NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP,
  received_by UUID REFERENCES auth.users(id),
  received_at TIMESTAMP
);

-- Transfer items table
CREATE TABLE transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  requested_quantity INTEGER NOT NULL,
  shipped_quantity INTEGER DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  from_location_id UUID,
  to_location_id UUID,
  batch TEXT,
  expiry_date DATE,
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'used', 'damaged', 'refurbished')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Warehouse tasks table
CREATE TABLE warehouse_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id),
  type TEXT NOT NULL CHECK (type IN ('receiving', 'picking', 'packing', 'shipping', 'counting', 'maintenance', 'cleaning', 'inspection')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  
  estimated_duration INTEGER NOT NULL, -- minutes
  actual_duration INTEGER,
  
  due_date TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  instructions TEXT,
  notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Warehouse alerts table
CREATE TABLE warehouse_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id),
  type TEXT NOT NULL CHECK (type IN ('capacity', 'temperature', 'humidity', 'security', 'equipment', 'safety', 'maintenance')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT, -- sensor ID, equipment ID, etc.
  value DECIMAL(10,2),
  threshold DECIMAL(10,2),
  
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users(id),
  resolution TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## การทดสอบ

### ข้อมูลทดสอบ
- คลังสินค้า: 4 แห่ง
- โซนคลัง: 4 โซน
- พนักงาน: 4 คน
- การโอนย้าย: 2 รายการ
- งาน: 3 งาน
- แจ้งเตือน: 4 รายการ

### การทดสอบฟีเจอร์
1. ดูภาพรวมคลังสินค้า
2. ค้นหาและกรองคลัง
3. ดูรายละเอียดคลัง
4. จัดการการโอนย้าย
5. ติดตามสถานะการขนส่ง
6. จัดการงานและแจ้งเตือน
7. ส่งออกรายงาน

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **การใช้งานพื้นที่ไม่ถูกต้อง**: ตรวจสอบการคำนวณและอัพเดทข้อมูล
2. **การโอนย้ายล่าช้า**: ตรวจสอบสถานะและประสานงานขนส่ง
3. **แจ้งเตือนไม่ทำงาน**: ตรวจสอบ sensors และการตั้งค่า
4. **งานไม่ได้รับมอบหมาย**: ตรวจสอบสิทธิ์และการแจ้งเตือน

### Performance Tips
- ใช้ index สำหรับการค้นหา
- Cache ข้อมูลที่ใช้บ่อย
- Optimize การ query ข้อมูลขนาดใหญ่
- ใช้ background job สำหรับการประมวลผลหนัก
- Implement real-time updates อย่างมีประสิทธิภาพ