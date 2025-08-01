# POS Sales Module

## ภาพรวม
POS (Point of Sale) Module เป็นระบบขายหน้าร้านที่ครบถ้วนสำหรับร้านเฟอร์นิเจอร์ รองรับการทำงานแบบ real-time และมี UI ที่ใช้งานง่าย

## ฟีเจอร์หลัก

### 🛒 การจัดการตะกร้าสินค้า
- เพิ่ม/ลบสินค้าในตะกร้า
- ปรับจำนวนสินค้า
- คำนวณราคารวมอัตโนมัติ
- ระบบส่วนลด
- คำนวณภาษี VAT 7%
- บันทึกข้อมูลใน localStorage

### 🔍 การค้นหาสินค้า
- ค้นหาตามชื่อสินค้า, SKU, หรือ barcode
- กรองตามหมวดหมู่
- แสดงสถานะสต็อก
- รองรับ barcode scanner

### 👥 การจัดการลูกค้า
- เพิ่มข้อมูลลูกค้า (ชื่อ, เบอร์โทร, อีเมล, ที่อยู่)
- ลูกค้าเดินเข้า (Walk-in customer)
- บันทึกประวัติการซื้อ

### 💳 ระบบชำระเงิน
- เงินสด (Cash)
- บัตรเครดิต/เดบิต (Card)
- โอนเงิน (Bank Transfer)

### 🧾 ใบเสร็จ
- แสดงตัวอย่างใบเสร็จแบบ real-time
- พิมพ์ใบเสร็จ
- ส่งออกเป็น CSV
- รูปแบบใบเสร็จมาตรฐาน

### ⌨️ Keyboard Shortcuts
- `Ctrl+N` หรือ `F1`: เริ่มการขายใหม่
- `Ctrl+Enter` หรือ `F12`: ชำระเงิน
- `Ctrl+Delete` หรือ `Esc`: ล้างตะกร้า
- `Ctrl+B` หรือ `F2`: เปิด barcode scanner
- `Ctrl+F` หรือ `F3`: ค้นหาสินค้า

## โครงสร้างไฟล์

```
src/
├── pages/
│   └── POS.tsx                      # หน้าหลัก POS
├── components/pos/
│   ├── ProductGrid.tsx              # แสดงรายการสินค้า
│   ├── CartSidebar.tsx              # ตะกร้าสินค้า
│   ├── ReceiptPreview.tsx           # แสดงตัวอย่างใบเสร็จ
│   ├── CheckoutDialog.tsx           # หน้าต่างชำระเงิน
│   ├── QuickActions.tsx             # ปุ่มลัด
│   ├── BarcodeScanner.tsx           # สแกน barcode
│   └── KeyboardShortcuts.tsx        # แสดง keyboard shortcuts
├── hooks/
│   ├── usePOS.ts                    # จัดการ state หลัก
│   ├── useKeyboardShortcuts.ts      # keyboard shortcuts
│   └── useLocalStorage.ts           # จัดการ localStorage
├── types/
│   └── pos.ts                       # TypeScript types
├── data/
│   └── mockProducts.ts              # ข้อมูลสินค้าตัวอย่าง
└── utils/
    ├── posHelpers.ts                # ฟังก์ชันช่วย
    └── exportHelpers.ts             # ส่งออกข้อมูล
```

## การใช้งาน

### 1. เริ่มการขาย
1. เลือกสินค้าจาก Product Grid
2. สินค้าจะถูกเพิ่มเข้าตะกร้าอัตโนมัติ
3. ปรับจำนวนหรือลบสินค้าได้ในตะกร้า

### 2. การค้นหาสินค้า
- ใช้ช่องค้นหาด้านบน
- เลือกหมวดหมู่จาก dropdown
- หรือใช้ barcode scanner

### 3. การชำระเงิน
1. คลิก "Checkout" หรือกด `F12`
2. เพิ่มข้อมูลลูกค้า (ถ้าต้องการ)
3. เลือกวิธีชำระเงิน
4. คลิก "Complete Sale"

### 4. การพิมพ์ใบเสร็จ
- คลิกปุ่ม "Print" ในส่วน Receipt Preview
- หรือส่งออกเป็น CSV

## การปรับแต่ง

### เพิ่มสินค้าใหม่
แก้ไขไฟล์ `src/data/mockProducts.ts`:

```typescript
{
  id: 'unique-id',
  name: 'ชื่อสินค้า',
  sku: 'SKU-CODE',
  price: 1000,
  category: 'หมวดหมู่',
  stock: 10,
  description: 'รายละเอียด',
  barcode: '1234567890123'
}
```

### เพิ่มวิธีชำระเงิน
แก้ไขไฟล์ `src/data/mockProducts.ts`:

```typescript
{
  id: 'payment-id',
  name: 'ชื่อวิธีชำระ',
  type: 'cash' | 'card' | 'transfer',
  icon: '💰'
}
```

### ปรับอัตราภาษี
แก้ไขค่า `TAX_RATE` ในไฟล์ `src/hooks/usePOS.ts`

## การพัฒนาต่อ

### ฟีเจอร์ที่ควรเพิ่ม
- [ ] เชื่อมต่อกับฐานข้อมูล Supabase
- [ ] ระบบสมาชิก/โปรโมชั่น
- [ ] รายงานยอดขาย
- [ ] การจัดการสต็อกแบบ real-time
- [ ] ระบบคิวการชำระเงิน
- [ ] รองรับเครื่องพิมพ์ใบเสร็จ
- [ ] การซิงค์ข้อมูลหลายสาขา
- [ ] Mobile responsive ที่ดีขึ้น
- [ ] เชื่อมต่อกับระบบสัญญาผ่อนชำระ (Installments Module)

### การเชื่อมต่อฐานข้อมูล
สร้าง tables ใน Supabase:

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  barcode TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'completed',
  status TEXT DEFAULT 'completed',
  employee_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sale items table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## การทดสอบ

### ข้อมูลทดสอบ
- สินค้าตัวอย่าง: 10 รายการ
- หมวดหมู่: 8 หมวด
- วิธีชำระเงิน: 4 วิธี
- Barcode: รองรับ EAN-13 (13 หลัก)

### การทดสอบฟีเจอร์
1. เพิ่มสินค้าในตะกร้า
2. ปรับจำนวนสินค้า
3. ใส่ส่วนลด
4. เลือกวิธีชำระเงิน
5. พิมพ์ใบเสร็จ
6. ทดสอบ keyboard shortcuts
7. ทดสอบ barcode scanner

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **สินค้าไม่แสดงในตะกร้า**: ตรวจสอบ stock > 0
2. **ไม่สามารถชำระเงินได้**: ต้องเลือกวิธีชำระเงิน
3. **Keyboard shortcuts ไม่ทำงาน**: ตรวจสอบว่าไม่ได้ focus ใน input field
4. **ใบเสร็จไม่พิมพ์**: ตรวจสอบ popup blocker

### Performance Tips
- ใช้ React.memo สำหรับ ProductGrid
- Debounce การค้นหา
- Lazy loading สำหรับรูปภาพสินค้า
- Virtual scrolling สำหรับรายการสินค้าจำนวนมาก