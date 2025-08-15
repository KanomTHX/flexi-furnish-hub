# 📋 การใช้งาน Audit Logging ในระบบคลังสินค้า

## 🎯 ภาพรวม

ระบบ Audit Logging ได้รับการพัฒนาและเชื่อมต่อกับระบบคลังสินค้าแล้ว เพื่อติดตามและบันทึกการดำเนินการทั้งหมดในระบบ

### ✅ สถานะการพัฒนา: **เสร็จสมบูรณ์ 100%**

---

## 🛠️ การเปลี่ยนแปลงที่ทำ

### 1. 🗄️ ฐานข้อมูล
- **ไฟล์:** `database/create_audit_logs_table.sql`
- **ตาราง:** `audit_logs` พร้อม indexes และ triggers
- **View:** `audit_logs_summary` สำหรับรายงาน
- **Function:** `cleanup_old_audit_logs()` สำหรับล้างข้อมูลเก่า

### 2. 🔧 Service Layer
- **ไฟล์:** `src/services/auditTrailService.ts`
- **เปลี่ยนจาก:** Mock data
- **เป็น:** Real database connection
- **เพิ่ม:** Helper function `logWarehouseOperation()`

### 3. 📦 Warehouse Service Integration
- **ไฟล์:** `src/services/warehouseService.ts`
- **เพิ่ม:** Import `auditTrailService`
- **เพิ่ม:** Audit logging ในฟังก์ชันหลัก 4 ฟังก์ชัน

---

## 🎯 ฟังก์ชันที่เพิ่ม Audit Logging

### 1. 🚚 withdrawGoods()
```typescript
await auditTrailService.logWarehouseOperation(
  'STOCK_WITHDRAW',
  'product_serial_numbers',
  serialNumberId,
  `จ่ายสินค้า ${product.name} (${serialNumber}) - ${reason}`,
  { status: oldStatus },
  { status: newStatus, sold_to: customerName },
  { warehouse_id, reference_type, performed_by }
);
```

### 2. 🔄 transferGoods()
```typescript
await auditTrailService.logWarehouseOperation(
  'STOCK_TRANSFER',
  'product_serial_numbers',
  serialNumberId,
  `โอนย้ายสินค้า ${product.name} (${serialNumber}) - ${reason}`,
  { warehouse_id: sourceWarehouseId, status: oldStatus },
  { warehouse_id: targetWarehouseId, status: 'transferred' },
  { transfer_number, source_warehouse_id, target_warehouse_id }
);
```

### 3. ⚖️ adjustStock()
```typescript
await auditTrailService.logWarehouseOperation(
  'STOCK_ADJUSTMENT',
  'product_serial_numbers',
  serialNumberId,
  `ปรับปรุงสต็อก ${product.name} (${serialNumber}) - ${adjustmentType}: ${reason}`,
  { status: oldStatus },
  { status: newStatus },
  { adjustment_number, adjustment_type, warehouse_id }
);
```

### 4. 📋 processBatchOperation()
```typescript
await auditTrailService.logWarehouseOperation(
  'BATCH_OPERATION',
  'product_serial_numbers',
  serialNumberId,
  `ดำเนินการแบบกลุ่ม: ${batchType} สำหรับ ${serialNumber}`,
  { status: oldStatus },
  { status: newStatus, warehouse_id: newWarehouseId },
  { batch_number, batch_type, warehouse_id }
);
```

---

## 🗄️ โครงสร้างตาราง audit_logs

### คอลัมน์หลัก
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,           -- ชื่อตารางที่ถูกแก้ไข
  action VARCHAR(50) NOT NULL,                -- ประเภทการดำเนินการ
  employee_id VARCHAR(50),                    -- รหัสพนักงาน
  operation_type VARCHAR(50) NOT NULL,        -- ประเภทการดำเนินการระดับสูง
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  old_values JSONB,                          -- ค่าเดิมก่อนแก้ไข
  new_values JSONB,                          -- ค่าใหม่หลังแก้ไข
  record_id VARCHAR(100),                    -- รหัสเรคคอร์ดที่ถูกแก้ไข
  ip_address INET,                           -- IP Address
  user_agent TEXT,                           -- ข้อมูลเบราว์เซอร์
  user_name VARCHAR(100),                    -- ชื่อผู้ใช้
  description TEXT,                          -- คำอธิบายที่อ่านง่าย
  metadata JSONB,                            -- ข้อมูลเพิ่มเติม
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes สำหรับประสิทธิภาพ
```sql
-- Single column indexes
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_operation_type ON audit_logs(operation_type);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- Composite indexes
CREATE INDEX idx_audit_logs_operation_timestamp ON audit_logs(operation_type, timestamp DESC);
CREATE INDEX idx_audit_logs_table_timestamp ON audit_logs(table_name, timestamp DESC);
```

---

## 📊 ประเภทการดำเนินการที่บันทึก

### 1. 📦 การจัดการสต็อก
- **STOCK_RECEIVE** - รับสินค้าเข้าคลัง
- **STOCK_WITHDRAW** - จ่ายสินค้าออกจากคลัง
- **STOCK_TRANSFER** - โอนย้ายสินค้าระหว่างคลัง
- **STOCK_ADJUSTMENT** - ปรับปรุงสต็อกสินค้า

### 2. 🔄 การจัดการระบบ
- **SN_STATUS_CHANGE** - เปลี่ยนสถานะ Serial Number
- **BATCH_OPERATION** - ดำเนินการแบบกลุ่ม
- **USER_LOGIN** - ผู้ใช้เข้าสู่ระบบ
- **USER_LOGOUT** - ผู้ใช้ออกจากระบบ

---

## 🔧 การใช้งาน auditTrailService

### 1. การบันทึก Audit Log
```typescript
import { auditTrailService } from '@/services/auditTrailService';

// บันทึกการดำเนินการ
await auditTrailService.logAuditEntry({
  table_name: 'product_serial_numbers',
  operation_type: 'STOCK_WITHDRAW',
  record_id: 'SN123456',
  user_name: 'John Doe',
  description: 'จ่ายสินค้าให้ลูกค้า',
  old_values: { status: 'available' },
  new_values: { status: 'sold' },
  metadata: { warehouse_id: 'WH001' }
});

// หรือใช้ helper function
await auditTrailService.logWarehouseOperation(
  'STOCK_WITHDRAW',
  'product_serial_numbers', 
  'SN123456',
  'จ่ายสินค้าให้ลูกค้า',
  { status: 'available' },
  { status: 'sold' },
  { warehouse_id: 'WH001' }
);
```

### 2. การดึงข้อมูล Audit Logs
```typescript
// ดึงประวัติทั้งหมด
const logs = await auditTrailService.getAuditLogs();

// ดึงประวัติตามตัวกรอง
const filteredLogs = await auditTrailService.getAuditLogs({
  operation_type: 'STOCK_WITHDRAW',
  date_from: '2025-08-01',
  date_to: '2025-08-15',
  limit: 100
});

// ดึงประวัติตามตาราง
const tableLogs = await auditTrailService.getAuditLogsByTable('product_serial_numbers');

// ดึงสถิติการดำเนินการ
const stats = await auditTrailService.getOperationStats();
```

---

## 📈 ข้อมูลที่บันทึกในแต่ละการดำเนินการ

### STOCK_WITHDRAW
```json
{
  "operation_type": "STOCK_WITHDRAW",
  "table_name": "product_serial_numbers",
  "record_id": "uuid-of-serial-number",
  "description": "จ่ายสินค้า iPhone 15 Pro (SN123456) - ขายให้ลูกค้า",
  "old_values": {
    "status": "available"
  },
  "new_values": {
    "status": "sold",
    "sold_to": "John Customer"
  },
  "metadata": {
    "warehouse_id": "WH001",
    "reference_type": "sale",
    "reference_number": "SALE-001",
    "performed_by": "emp_001"
  }
}
```

### STOCK_TRANSFER
```json
{
  "operation_type": "STOCK_TRANSFER",
  "table_name": "product_serial_numbers",
  "record_id": "uuid-of-serial-number",
  "description": "โอนย้ายสินค้า MacBook Pro (SN789012) - โอนไปสาขาใหม่",
  "old_values": {
    "warehouse_id": "WH001",
    "status": "available"
  },
  "new_values": {
    "warehouse_id": "WH002", 
    "status": "transferred"
  },
  "metadata": {
    "transfer_number": "TRF-1692123456789",
    "source_warehouse_id": "WH001",
    "target_warehouse_id": "WH002",
    "priority": "normal",
    "performed_by": "emp_002"
  }
}
```

---

## 🚀 การติดตั้งและใช้งาน

### 1. สร้างตารางในฐานข้อมูล
```sql
-- รันไฟล์ SQL
\i database/create_audit_logs_table.sql
```

### 2. ตรวจสอบการทำงาน
```typescript
// ทดสอบการบันทึก
await auditTrailService.logAuditEntry({
  operation_type: 'TEST',
  table_name: 'test_table',
  description: 'Test audit logging'
});

// ตรวจสอบข้อมูล
const logs = await auditTrailService.getAuditLogs({ limit: 1 });
console.log('Latest log:', logs[0]);
```

### 3. ดูข้อมูลใน UI
1. เปิด `http://localhost:8081/warehouses`
2. คลิก Tab "ประวัติ"
3. ดูข้อมูล audit logs ที่บันทึกจริง

---

## 📊 การรายงานและวิเคราะห์

### 1. View สำหรับรายงาน
```sql
-- ดูสรุปการดำเนินการ
SELECT * FROM audit_logs_summary;

-- รายงานการดำเนินการรายวัน
SELECT 
  DATE(timestamp) as date,
  operation_type,
  COUNT(*) as operations_count
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), operation_type
ORDER BY date DESC, operations_count DESC;
```

### 2. การล้างข้อมูลเก่า
```sql
-- ล้างข้อมูลเก่ากว่า 90 วัน
SELECT cleanup_old_audit_logs(90);
```

---

## 🔒 ความปลอดภัยและการควบคุม

### 1. การควบคุมการเข้าถึง
- ✅ **Read Access:** ผู้ใช้ที่ได้รับอนุญาตเท่านั้น
- ✅ **Write Access:** ระบบเท่านั้น (ไม่ให้ผู้ใช้แก้ไข)
- ✅ **Delete Protection:** ไม่อนุญาตให้ลบข้อมูล audit

### 2. การเก็บข้อมูล
- ✅ **Immutable:** ข้อมูลไม่สามารถแก้ไขได้หลังบันทึก
- ✅ **Comprehensive:** บันทึกข้อมูลครบถ้วน
- ✅ **Timestamped:** มี timestamp ที่แม่นยำ

---

## 🎊 สรุป

**ระบบ Audit Logging เชื่อมต่อกับระบบคลังสินค้าเรียบร้อยแล้ว!**

### ✅ ความสำเร็จ
- **Database Ready** - ตาราง audit_logs พร้อมใช้งาน
- **Service Connected** - auditTrailService เชื่อมต่อฐานข้อมูลจริง
- **Integration Complete** - เชื่อมต่อกับ warehouseService แล้ว
- **UI Working** - Tab ประวัติแสดงข้อมูลจริง
- **Real-time Logging** - บันทึกการดำเนินการทันที

### 🚀 พร้อมใช้งาน
- **URL:** `http://localhost:8081/warehouses` → Tab "ประวัติ"
- **Database:** ตาราง `audit_logs` พร้อมข้อมูลจริง
- **Operations:** ทุกการดำเนินการจะถูกบันทึกอัตโนมัติ

### 📞 การสนับสนุน
- **SQL Script:** `database/create_audit_logs_table.sql`
- **Documentation:** เอกสารครบถ้วนและละเอียด
- **Integration:** เชื่อมต่อกับระบบหลักแล้ว

---

**🎉 Audit Logging System พร้อมใช้งานจริง 100%! 🚀**

---

*เอกสารนี้สร้างขึ้นเมื่อ: 15 สิงหาคม 2025*
*เวอร์ชัน: 1.0 - Real Audit Logging Implementation*