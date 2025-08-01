# Stock Management Module

## ภาพรวม
Stock Management Module เป็นระบบจัดการสต็อกสินค้าแบบครบวงจร สำหรับร้านเฟอร์นิเจอร์ รองรับการติดตามสต็อก การเคลื่อนไหวสินค้า และการจัดการคลังสินค้าหลายสถานที่

## ฟีเจอร์หลัก

### 📦 การจัดการสต็อกสินค้า
- ติดตามสต็อกแบบ real-time
- จัดการสต็อกหลายสถานที่
- ระบบแจ้งเตือนสต็อกต่ำ/หมด/เกิน
- คำนวณจุดสั่งซื้อใหม่อัตโนมัติ
- ติดตามต้นทุนเฉลี่ยแบบ Weighted Average

### 📊 การติดตามการเคลื่อนไหว
- บันทึกการรับเข้า-จ่ายออกสินค้า
- ประวัติการเคลื่อนไหวแบบละเอียด
- การโอนย้ายระหว่างสถานที่
- การปรับปรุงสต็อก
- รายงานการเคลื่อนไหวตามช่วงเวลา

### 🏢 การจัดการสถานที่เก็บ
- คลังสินค้าหลัก
- ห้องโชว์รูม
- ร้านค้าหน้าร้าน
- โซนสินค้าชำรุด
- ติดตามการใช้งานพื้นที่

### 🚨 ระบบแจ้งเตือน
- สต็อกต่ำกว่าเกณฑ์
- สินค้าหมดสต็อก
- สต็อกเกินเกณฑ์
- สินค้าใกล้หมดอายุ
- การแจ้งเตือนแบบ real-time

### 📈 รายงานและการวิเคราะห์
- สรุปมูลค่าสต็อก
- การวิเคราะห์การเคลื่อนไหว
- สินค้าเคลื่อนไหวเร็ว/ช้า
- อัตราการหมุนเวียนสต็อก
- รายงาน ABC Analysis

## โครงสร้างไฟล์

```
src/
├── pages/
│   └── Stock.tsx                    # หน้าหลัก Stock Management
├── components/stock/
│   ├── StockOverview.tsx            # ภาพรวมสต็อก
│   ├── ProductStockTable.tsx        # ตารางสินค้าและสต็อก
│   ├── StockMovementHistory.tsx     # ประวัติการเคลื่อนไหว
│   └── StockAdjustmentDialog.tsx    # หน้าต่างปรับปรุงสต็อก
├── hooks/
│   └── useStock.ts                  # จัดการ state สต็อก
├── types/
│   └── stock.ts                     # TypeScript types
├── data/
│   └── mockStockData.ts             # ข้อมูลตัวอย่าง
└── utils/
    └── stockHelpers.ts              # ฟังก์ชันช่วย
```

## การใช้งาน

### 1. ภาพรวมสต็อก
- ดูสรุปข้อมูลสต็อกทั้งหมด
- ติดตามมูลค่าสต็อก
- ดูการเคลื่อนไหวรายวัน/เดือน
- ตรวจสอบแจ้งเตือนล่าสุด

### 2. จัดการรายการสินค้า
- ดูรายการสินค้าและสต็อกปัจจุบัน
- ค้นหาและกรองสินค้า
- ดูรายละเอียดสินค้าแต่ละรายการ
- ปรับปรุงสต็อกด่วน

### 3. ติดตามการเคลื่อนไหว
- ดูประวัติการเคลื่อนไหวทั้งหมด
- กรองตามประเภท วันที่ สถานที่
- ส่งออกรายงานการเคลื่อนไหว

### 4. การปรับปรุงสต็อก
- เพิ่มสต็อก (รับเข้า)
- ลดสต็อก (จ่ายออก)
- ปรับปรุงสต็อก (แก้ไข)
- บันทึกเหตุผลและหมายเหตุ

## ประเภทการเคลื่อนไหวสต็อก

### 1. รับเข้า (Stock In)
- รับสินค้าจากผู้จัดจำหน่าย
- สินค้าคืนจากลูกค้า
- การผลิตเพิ่ม
- โอนเข้าจากสาขาอื่น

### 2. จ่ายออก (Stock Out)
- ขายสินค้าให้ลูกค้า
- สินค้าชำรุด/หมดอายุ
- สินค้าสูญหาย
- โอนออกไปสาขาอื่น
- ใช้ภายในบริษัท

### 3. ปรับปรุง (Adjustment)
- ปรับปรุงจากการตรวจนับ
- แก้ไขข้อผิดพลาดการบันทึก
- ปรับปรุงระบบ

### 4. โอนย้าย (Transfer)
- โอนระหว่างสถานที่เก็บ
- ย้ายไปโชว์รูม
- ย้ายไปร้านหน้าร้าน

## สถานะสต็อก

### ปกติ (In Stock)
- สต็อกอยู่ในระดับปกติ
- มากกว่าสต็อกขั้นต่ำ
- น้อยกว่าสต็อกสูงสุด

### สต็อกต่ำ (Low Stock)
- สต็อกต่ำกว่าหรือเท่ากับระดับขั้นต่ำ
- ควรสั่งซื้อเพิ่ม
- แจ้งเตือนระดับสูง

### หมดสต็อก (Out of Stock)
- สต็อกเหลือ 0 ชิ้น
- ไม่สามารถขายได้
- แจ้งเตือนระดับวิกฤต

### สต็อกเกิน (Overstock)
- สต็อกเกินกว่าระดับสูงสุด
- อาจมีต้นทุนการเก็บสูง
- แจ้งเตือนระดับปานกลาง

## การคำนวณ

### ต้นทุนเฉลี่ย (Weighted Average Cost)
```typescript
const totalValue = (currentCost * currentQuantity) + (newCost * newQuantity);
const totalQuantity = currentQuantity + newQuantity;
const averageCost = totalValue / totalQuantity;
```

### จุดสั่งซื้อใหม่ (Reorder Point)
```typescript
const reorderPoint = (averageDailyUsage * leadTimeDays) + safetyStock;
```

### อัตราการหมุนเวียน (Stock Turnover)
```typescript
const turnoverRate = annualSoldQuantity / averageStock;
```

### จำนวนวันที่สต็อกจะหมด (Days of Supply)
```typescript
const daysOfSupply = currentStock / averageDailyUsage;
```

## การตั้งค่าสต็อก

### สต็อกขั้นต่ำ (Minimum Stock)
- ระดับสต็อกที่ต้องสั่งซื้อเพิ่ม
- ป้องกันการขาดแคลน
- คำนวณจากการใช้งานเฉลี่ย

### สต็อกสูงสุด (Maximum Stock)
- ระดับสต็อกสูงสุดที่ควรเก็บ
- ป้องกันการลงทุนเกิน
- คำนวณจากพื้นที่และต้นทุน

### จุดสั่งซื้อ (Reorder Point)
- จุดที่ควรสั่งซื้อสินค้าเพิ่ม
- คำนวณจาก Lead Time
- รวม Safety Stock

### จำนวนสั่งซื้อ (Reorder Quantity)
- จำนวนที่ควรสั่งซื้อแต่ละครั้ง
- คำนวณจาก EOQ
- พิจารณาส่วนลดจำนวน

## ระบบแจ้งเตือน

### ระดับความสำคัญ
- **วิกฤต (Critical)**: หมดสต็อก, ระบบล่ม
- **สูง (High)**: สต็อกต่ำมาก, ใกล้หมดอายุ
- **ปานกลาง (Medium)**: สต็อกเกิน, การเคลื่อนไหวผิดปกติ
- **ต่ำ (Low)**: การแจ้งเตือนทั่วไป

### ประเภทการแจ้งเตือน
- **สต็อกต่ำ**: เมื่อสต็อกต่ำกว่าเกณฑ์
- **หมดสต็อก**: เมื่อสต็อกเหลือ 0
- **สต็อกเกิน**: เมื่อสต็อกเกินเกณฑ์
- **ใกล้หมดอายุ**: สินค้าใกล้หมดอายุ

## การส่งออกข้อมูล

### รายงานสต็อก
- SKU, ชื่อสินค้า, หมวดหมู่
- สต็อกปัจจุบัน, จอง, พร้อมขาย
- สต็อกขั้นต่ำ/สูงสุด, จุดสั่งซื้อ
- ต้นทุนเฉลี่ย, มูลค่ารวม
- สถานะสต็อก, ผู้จัดจำหน่าย

### รายงานการเคลื่อนไหว
- วันที่, SKU, ชื่อสินค้า
- ประเภท, จำนวน, สต็อกก่อน/หลัง
- เหตุผล, เลขที่อ้างอิง
- ต้นทุน, สถานที่
- ผู้จัดจำหน่าย, ผู้ดำเนินการ

## การพัฒนาต่อ

### ฟีเจอร์ที่ควรเพิ่ม
- [ ] เชื่อมต่อกับฐานข้อมูล Supabase
- [ ] ระบบ Purchase Order
- [ ] การตรวจนับสต็อก (Stock Take)
- [ ] การจัดการ Batch/Lot
- [ ] ระบบ Barcode/QR Code
- [ ] การพยากรณ์ความต้องการ
- [ ] รายงานขั้นสูงและกราฟ
- [ ] การแจ้งเตือนผ่าน Email/SMS
- [ ] Mobile app สำหรับการตรวจนับ
- [ ] การเชื่อมต่อกับ POS และ E-commerce

### การเชื่อมต่อฐานข้อมูล
สร้าง tables ใน Supabase:

```sql
-- Products table (ขยายจากตาราง products เดิม)
ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN max_stock INTEGER DEFAULT 100;
ALTER TABLE products ADD COLUMN reorder_point INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN reorder_quantity INTEGER DEFAULT 20;
ALTER TABLE products ADD COLUMN average_cost DECIMAL(10,2) DEFAULT 0;

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'store', 'display', 'damaged', 'quarantine')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  capacity INTEGER,
  current_utilization INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock levels table
CREATE TABLE stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, location_id)
);

-- Stock movements table
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference TEXT,
  cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  batch TEXT,
  expiry_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  employee_id UUID REFERENCES auth.users(id),
  employee_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stock alerts table
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'out_of_stock', 'overstock', 'expiring')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'completed', 'cancelled')),
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP
);

-- Purchase order items table
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  remaining_quantity INTEGER GENERATED ALWAYS AS (quantity - received_quantity) STORED,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock takes table
CREATE TABLE stock_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  take_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled')),
  type TEXT NOT NULL CHECK (type IN ('full', 'partial', 'cycle')),
  location_id UUID REFERENCES locations(id),
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  total_variance INTEGER DEFAULT 0,
  total_variance_value DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id)
);

-- Stock take items table
CREATE TABLE stock_take_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_take_id UUID REFERENCES stock_takes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - system_quantity) STORED,
  variance_value DECIMAL(10,2) DEFAULT 0,
  reason TEXT,
  notes TEXT,
  counted_by TEXT,
  counted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## การทดสอบ

### ข้อมูลทดสอบ
- สินค้า: 7 รายการ
- สถานที่เก็บ: 4 สถานที่
- ผู้จัดจำหน่าย: 4 ราย
- การเคลื่อนไหว: 5 รายการ
- แจ้งเตือน: 4 รายการ

### การทดสอบฟีเจอร์
1. ดูภาพรวมสต็อก
2. ค้นหาและกรองสินค้า
3. ปรับปรุงสต็อก (เพิ่ม/ลด/แก้ไข)
4. ดูประวัติการเคลื่อนไหว
5. จัดการแจ้งเตือน
6. ส่งออกรายงาน
7. ตรวจสอบการคำนวณต้นทุน

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **สต็อกไม่ตรงกับความเป็นจริง**: ตรวจสอบการบันทึกและทำการตรวจนับ
2. **แจ้งเตือนไม่ทำงาน**: ตรวจสอบการตั้งค่าระดับสต็อก
3. **ต้นทุนไม่ถูกต้อง**: ตรวจสอบการคำนวณ Weighted Average
4. **ไม่สามารถส่งออกได้**: ตรวจสอบ permissions และข้อมูล

### Performance Tips
- ใช้ index สำหรับการค้นหา
- Pagination สำหรับข้อมูลจำนวนมาก
- Cache ข้อมูลที่ใช้บ่อย
- Background job สำหรับการคำนวณหนัก
- Optimize การ query ฐานข้อมูล