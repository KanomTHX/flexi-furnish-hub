# Serial Number Management System Design

## ภาพรวมระบบ

ระบบ Serial Number Management ถูกออกแบบเพื่อให้สินค้าทุกชิ้นที่รับเข้าจาก supplier มี Serial Number (SN) ผูกติดเสมอ เพื่อการติดตาม การขาย การเช่าซื้อ และการเคลมที่มีประสิทธิภาพ

## หลักการออกแบบ

### 1. บังคับใช้ Serial Number
- **สินค้าทุกชิ้น** ที่รับเข้าจาก supplier ต้องมี SN
- ไม่อนุญาตให้รับสินค้าเข้าระบบโดยไม่มี SN
- SN ต้องไม่ซ้ำกันในระบบ (Unique)
- รองรับการสร้าง SN อัตโนมัติหากไม่มีจาก supplier

### 2. การติดตามตลอดวงจรชีวิตสินค้า
- **รับสินค้า**: บันทึก SN พร้อมข้อมูล supplier, invoice, cost
- **จัดเก็บ**: ติดตามตำแหน่งในคลัง
- **โอนย้าย**: ติดตามการเคลื่อนไหวระหว่างคลัง
- **ขาย**: บันทึกข้อมูลลูกค้า วันที่ขาย
- **เช่าซื้อ**: ติดตามสถานะการผ่อนชำระ
- **เคลม**: ติดตามประวัติการเคลมและการซ่อม

### 3. การผูกข้อมูลแบบครอบคลุม
- ผูกกับ Product Master Data
- ผูกกับ Supplier Information
- ผูกกับ Purchase Order
- ผูกกับ Sales Transaction
- ผูกกับ Installment Plan (เช่าซื้อ)
- ผูกกับ Claim Records

## โครงสร้างข้อมูล

### 1. Serial Number Master (product_serial_numbers)
```sql
CREATE TABLE product_serial_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  supplier_id UUID REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  invoice_number VARCHAR(50),
  unit_cost DECIMAL(15,2),
  
  -- สถานะสินค้า
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN (
    'available',    -- พร้อมขาย
    'reserved',     -- จองแล้ว
    'sold',         -- ขายแล้ว
    'installment',  -- เช่าซื้อ
    'claimed',      -- เคลม
    'damaged',      -- เสียหาย
    'transferred',  -- โอนย้าย
    'returned'      -- คืนสินค้า
  )),
  
  -- ข้อมูลการขาย
  sold_at TIMESTAMP,
  sold_to VARCHAR(255),
  sale_transaction_id UUID REFERENCES sales_transactions(id),
  
  -- ข้อมูลเช่าซื้อ
  installment_plan_id UUID REFERENCES installment_plans(id),
  installment_status VARCHAR(20),
  
  -- ข้อมูลการเคลม
  claim_id UUID REFERENCES claims(id),
  claim_status VARCHAR(20),
  
  -- ตำแหน่งในคลัง
  zone_id UUID REFERENCES warehouse_zones(id),
  shelf_id UUID REFERENCES warehouse_shelves(id),
  position VARCHAR(50),
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### 2. Serial Number History (serial_number_history)
```sql
CREATE TABLE serial_number_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number_id UUID NOT NULL REFERENCES product_serial_numbers(id),
  action_type VARCHAR(50) NOT NULL, -- 'receive', 'transfer', 'sell', 'claim', 'repair'
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  old_warehouse_id UUID,
  new_warehouse_id UUID,
  reference_type VARCHAR(50), -- 'purchase_order', 'sales_transaction', 'claim', 'transfer'
  reference_id UUID,
  reference_number VARCHAR(100),
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Warehouse Zones และ Shelves
```sql
CREATE TABLE warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  zone_code VARCHAR(20) NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  zone_type VARCHAR(30), -- 'receiving', 'storage', 'picking', 'shipping'
  capacity INTEGER,
  temperature_controlled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE warehouse_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES warehouse_zones(id),
  shelf_code VARCHAR(20) NOT NULL,
  shelf_name VARCHAR(100),
  max_capacity INTEGER,
  current_capacity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Business Rules

### 1. การรับสินค้า (Goods Receipt)
- **บังคับ SN**: ไม่สามารถรับสินค้าเข้าระบบได้หากไม่มี SN
- **Auto-Generate SN**: หาก supplier ไม่ให้ SN สามารถสร้างอัตโนมัติตามรูปแบบ:
  - Format: `{PRODUCT_CODE}-{YYYY}{MM}{DD}-{SEQUENCE}`
  - ตัวอย่าง: `SOFA001-20241201-001`
- **Validation**: ตรวจสอบ SN ไม่ซ้ำในระบบ
- **Location Assignment**: กำหนดตำแหน่งเก็บในคลังทันที

### 2. การขาย (Sales)
- ตรวจสอบสถานะสินค้าเป็น 'available'
- อัปเดตสถานะเป็น 'sold'
- บันทึกข้อมูลลูกค้าและการขาย
- สร้าง history record

### 3. การเช่าซื้อ (Installment)
- ตรวจสอบสถานะสินค้าเป็น 'available'
- อัปเดตสถานะเป็น 'installment'
- ผูกกับ installment plan
- ติดตามสถานะการชำระ

### 4. การเคลม (Claims)
- รองรับการเคลมในทุกสถานะ (ยกเว้น 'damaged')
- อัปเดตสถานะเป็น 'claimed'
- ผูกกับ claim record
- ติดตามกระบวนการซ่อม/เปลี่ยน

### 5. การโอนย้าย (Transfer)
- ติดตามการเคลื่อนไหวระหว่างคลัง
- อัปเดตตำแหน่งใหม่
- สร้าง transfer history

## API Design

### 1. Serial Number Management APIs

#### Create Serial Numbers (Bulk)
```typescript
POST /api/warehouse/serial-numbers/bulk
{
  warehouseId: string;
  supplierId: string;
  purchaseOrderId?: string;
  invoiceNumber?: string;
  items: {
    productId: string;
    serialNumbers: string[]; // หาก empty จะ auto-generate
    unitCost: number;
    zoneId?: string;
    shelfId?: string;
  }[];
}
```

#### Get Serial Number Details
```typescript
GET /api/warehouse/serial-numbers/{serialNumber}
Response: {
  id: string;
  serialNumber: string;
  product: ProductInfo;
  warehouse: WarehouseInfo;
  status: SerialNumberStatus;
  location: LocationInfo;
  history: HistoryRecord[];
  currentOwner?: CustomerInfo;
  installmentPlan?: InstallmentInfo;
  claimHistory?: ClaimInfo[];
}
```

#### Update Serial Number Status
```typescript
PUT /api/warehouse/serial-numbers/{id}/status
{
  newStatus: SerialNumberStatus;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  newLocation?: {
    warehouseId?: string;
    zoneId?: string;
    shelfId?: string;
    position?: string;
  };
}
```

#### Search Serial Numbers
```typescript
GET /api/warehouse/serial-numbers/search
Query Parameters:
- serialNumber?: string
- productId?: string
- warehouseId?: string
- status?: SerialNumberStatus
- supplierId?: string
- dateFrom?: string
- dateTo?: string
- limit?: number
- offset?: number
```

### 2. Integration APIs

#### POS Integration
```typescript
POST /api/pos/check-availability
{
  items: {
    productId: string;
    quantity: number;
    warehouseId: string;
  }[];
}

Response: {
  available: boolean;
  items: {
    productId: string;
    availableSerialNumbers: string[];
    requestedQuantity: number;
    availableQuantity: number;
  }[];
}
```

#### Sales Transaction Integration
```typescript
POST /api/sales/complete-with-serial-numbers
{
  transactionId: string;
  items: {
    productId: string;
    serialNumbers: string[];
    saleType: 'cash' | 'installment';
    installmentPlanId?: string;
  }[];
  customerId: string;
}
```

#### Claims Integration
```typescript
POST /api/claims/create-with-serial-number
{
  serialNumber: string;
  claimType: string;
  description: string;
  customerId: string;
  expectedResolution: string;
}
```

## UI/UX Design

### 1. Serial Number Dashboard
- **Overview Cards**: Total SN, Available, Sold, In Claims
- **Status Distribution Chart**: แสดงสัดส่วนสถานะต่างๆ
- **Recent Activities**: กิจกรรมล่าสุดของ SN
- **Quick Search**: ค้นหา SN แบบเร็ว

### 2. Goods Receipt with SN
- **SN Input Methods**:
  - Manual Entry
  - Barcode Scanner
  - Bulk Import (CSV/Excel)
  - Auto-Generate
- **Validation Feedback**: แสดงสถานะการตรวจสอบ SN
- **Location Assignment**: เลือกโซนและชั้นวางทันที

### 3. SN Tracking & History
- **Timeline View**: แสดงประวัติการเคลื่อนไหว
- **Current Status**: สถานะปัจจุบันและตำแหน่ง
- **Related Records**: ลิงก์ไปยัง PO, Sales, Claims
- **QR Code**: สร้าง QR Code สำหรับ SN

### 4. Warehouse Location Management
- **Zone Management**: จัดการโซนในคลัง
- **Shelf Management**: จัดการชั้นวางและตำแหน่ง
- **Capacity Tracking**: ติดตามความจุและการใช้งาน
- **Visual Layout**: แสดงผังคลังแบบ visual

## Implementation Plan

### Phase 1: Core SN System
1. สร้าง database schema
2. พัฒนา basic CRUD APIs
3. สร้าง SN generation logic
4. พัฒนา validation system

### Phase 2: Integration
1. เชื่อมต่อกับ Goods Receipt
2. เชื่อมต่อกับ POS System
3. เชื่อมต่อกับ Claims System
4. เชื่อมต่อกับ Transfer System

### Phase 3: Advanced Features
1. Location Management
2. Advanced Search & Reporting
3. Mobile App Support
4. Barcode/QR Code Integration

### Phase 4: Analytics & Optimization
1. SN Analytics Dashboard
2. Performance Optimization
3. Advanced Reporting
4. Predictive Analytics

## Security & Compliance

### 1. Data Security
- Encrypt sensitive SN data
- Role-based access control
- Audit trail for all changes
- Backup and recovery procedures

### 2. Business Continuity
- SN generation failover
- Data synchronization
- Disaster recovery plan
- Performance monitoring

## Testing Strategy

### 1. Unit Testing
- SN generation algorithms
- Validation logic
- Status transition rules
- API endpoints

### 2. Integration Testing
- POS integration
- Claims integration
- Transfer workflows
- Reporting accuracy

### 3. Performance Testing
- Large volume SN handling
- Search performance
- Concurrent operations
- Database optimization

### 4. User Acceptance Testing
- Goods receipt workflows
- Sales processes
- Claims handling
- Reporting functionality

ระบบนี้จะช่วยให้การติดตามสินค้าทุกชิ้นเป็นไปอย่างมีประสิทธิภาพ และรองรับการขาย การเช่าซื้อ และการเคลมได้อย่างครอบคลุม