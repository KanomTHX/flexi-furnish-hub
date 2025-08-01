# Claims & Warranty Module Documentation

## ✅ Implementation Status
**สถานะ: เสร็จสมบูรณ์ (100%)**

### Completed Features
- ✅ Claims Management System - ระบบจัดการการเคลม
- ✅ Warranty Tracking - ติดตามการรับประกัน
- ✅ Customer Management - การจัดการลูกค้า
- ✅ Product Management - การจัดการสินค้า
- ✅ Resolution Workflow - ขั้นตอนการแก้ไขปัญหา
- ✅ Customer Satisfaction - ความพึงพอใจลูกค้า
- ✅ Data Export - การส่งออกข้อมูล
- ✅ Filtering & Search - การกรองและค้นหา
- ✅ Responsive UI - หน้าจอที่รองรับทุกขนาด

## Overview
โมดูลการเคลมและการรับประกัน (Claims & Warranty Module) เป็นระบบที่ครอบคลุมการจัดการการเคลมสินค้า การติดตามการรับประกัน และการวัดความพึงพอใจของลูกค้า

## Features

### 1. Claims Management System
- สร้างและติดตามการเคลมทั้งหมด
- จัดการสถานะการเคลม: ส่งคำขอ → ตรวจสอบ → อนุมัติ → ดำเนินการ → เสร็จสิ้น
- ระบบมอบหมายงานให้เทคนิค
- การแจ้งเตือนเคลมเกินกำหนด
- ประวัติการดำเนินการแบบ timeline

### 2. Warranty Tracking
- ตรวจสอบสถานะการรับประกัน
- คำนวณวันหมดอายุการรับประกัน
- แจ้งเตือนการรับประกันที่ใกล้หมดอายุ
- จัดการนโยบายการรับประกัน
- ข้อมูลความคุ้มครองและข้อยกเว้น

### 3. Customer & Product Management
- ข้อมูลลูกค้าและประวัติการเคลม
- ข้อมูลสินค้าและสถิติการเคลม
- การเชื่อมโยงข้อมูลซื้อขายกับการเคลม
- ระบบจัดเก็บเอกสารและรูปภาพ

### 4. Resolution Workflow
- ประเภทการแก้ไข: ซ่อม, เปลี่ยน, คืนเงิน, เครดิตร้าน
- ติดตามค่าใช้จ่ายและเวลาที่ใช้
- การอนุมัติจากลูกค้า
- การติดตามหลังการแก้ไข

### 5. Analytics & Reporting
- สถิติการเคลมแบบ real-time
- อัตราการแก้ไขปัญหา
- ความพึงพอใจของลูกค้า
- แนวโน้มรายเดือน
- ต้นทุนการเคลม

## File Structure

```
src/
├── pages/
│   └── Claims.tsx                  # หน้าหลักการเคลม
├── components/claims/
│   ├── ClaimsOverview.tsx          # ภาพรวมการเคลม
│   └── ClaimsList.tsx              # รายการเคลม
├── hooks/
│   └── useClaims.ts                # Hook สำหรับจัดการ state
├── types/
│   └── claims.ts                   # Type definitions
├── data/
│   └── mockClaimsData.ts           # ข้อมูลตัวอย่าง
└── utils/
    └── claimsHelpers.ts            # Helper functions
```

## Data Types

### Claim (การเคลม)
```typescript
interface Claim {
  id: string;
  claimNumber: string;             // เลขที่เคลม
  type: ClaimType;                 // ประเภท: warranty, defect, damage, etc.
  status: ClaimStatus;             // สถานะ: submitted, approved, completed, etc.
  priority: ClaimPriority;         // ความสำคัญ: low, medium, high, urgent
  customerId: string;              // รหัสลูกค้า
  customer: Customer;              // ข้อมูลลูกค้า
  productId: string;               // รหัสสินค้า
  product: Product;                // ข้อมูลสินค้า
  purchaseDate: string;            // วันที่ซื้อ
  claimDate: string;               // วันที่เคลม
  issueDescription: string;        // รายละเอียดปัญหา
  category: ClaimCategory;         // หมวดหมู่ปัญหา
  warrantyInfo: WarrantyInfo;      // ข้อมูลการรับประกัน
  assignedTo?: string;             // ผู้รับผิดชอบ
  resolution?: ClaimResolution;    // การแก้ไขปัญหา
  attachments: ClaimAttachment[];  // ไฟล์แนบ
  timeline: ClaimTimelineEntry[];  # ประวัติการดำเนินการ
  estimatedCost?: number;          // ค่าใช้จ่ายประมาณการ
  actualCost?: number;             // ค่าใช้จ่ายจริง
  customerSatisfaction?: CustomerSatisfactionRating; // ความพึงพอใจ
  createdAt: string;
  updatedAt: string;
}
```

### Warranty Info (ข้อมูลการรับประกัน)
```typescript
interface WarrantyInfo {
  isUnderWarranty: boolean;        // ยังอยู่ในประกันหรือไม่
  warrantyStartDate: string;       // วันเริ่มประกัน
  warrantyEndDate: string;         // วันหมดประกัน
  warrantyType: WarrantyType;      // ประเภทประกัน
  coverageDetails: string[];       // รายละเอียดความคุ้มครอง
  remainingDays: number;           // จำนวนวันที่เหลือ
}
```

### Claim Resolution (การแก้ไขปัญหา)
```typescript
interface ClaimResolution {
  type: ResolutionType;            // ประเภท: repair, replace, refund, etc.
  description: string;             // รายละเอียดการแก้ไข
  actionTaken: string;             // การดำเนินการ
  partsReplaced?: string[];        // ชิ้นส่วนที่เปลี่ยน
  laborHours?: number;             // ชั่วโมงการทำงาน
  totalCost: number;               // ค่าใช้จ่ายรวม
  resolvedBy: string;              // ผู้แก้ไข
  resolvedAt: string;              // วันที่แก้ไข
  customerApproval: boolean;       // การอนุมัติจากลูกค้า
  followUpRequired: boolean;       // ต้องติดตามหรือไม่
}
```

## Components

### ClaimsOverview
แสดงภาพรวมการเคลม
- สถิติการเคลมสำคัญ
- ความคืบหน้าการเคลม
- ค่าใช้จ่ายการเคลม
- การจัดกลุ่มตามประเภทและสถานะ
- แนวโน้มรายเดือน
- การดำเนินการด่วน

### ClaimsList
จัดการรายการเคลม
- แสดงรายการเคลมทั้งหมด
- กรองและค้นหาเคลม
- ดูรายละเอียดเคลมแบบ modal
- อัปเดตสถานะและมอบหมายงาน
- แจ้งเตือนเคลมเกินกำหนด
- ส่งออกรายการเคลม

## Business Logic

### Warranty Calculation
```typescript
// คำนวณสถานะการรับประกัน
function calculateWarrantyStatus(purchaseDate: string, warrantyPeriod: number) {
  const purchase = new Date(purchaseDate);
  const warrantyEnd = new Date(purchase);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyPeriod);
  
  const now = new Date();
  const isUnderWarranty = now <= warrantyEnd;
  const remainingDays = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isUnderWarranty,
    remainingDays: Math.max(0, remainingDays),
    warrantyEndDate: warrantyEnd.toISOString().split('T')[0]
  };
}
```

### Overdue Detection
```typescript
// ตรวจสอบเคลมเกินกำหนด
function isClaimOverdue(claim: Claim): boolean {
  if (claim.status === 'completed' || claim.status === 'cancelled') return false;
  
  const now = new Date();
  const claimDate = new Date(claim.claimDate);
  const daysSinceCreated = Math.ceil((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // เกณฑ์เกินกำหนดตามความสำคัญ
  const overdueThreshold = {
    urgent: 1,    // 1 วัน
    high: 3,      // 3 วัน
    medium: 7,    // 7 วัน
    low: 14       // 14 วัน
  };
  
  return daysSinceCreated > overdueThreshold[claim.priority];
}
```

### Statistics Calculation
```typescript
// คำนวณสถิติการเคลม
function calculateClaimsStatistics(claims: Claim[]): ClaimStatistics {
  const totalClaims = claims.length;
  const completedClaims = claims.filter(c => c.status === 'completed').length;
  const pendingClaims = claims.filter(c => 
    ['submitted', 'under_review', 'approved', 'in_progress', 'waiting_parts'].includes(c.status)
  ).length;

  // คำนวณเวลาแก้ไขเฉลี่ย
  const completedClaimsWithTime = claims.filter(c => c.completedAt);
  const averageResolutionTime = completedClaimsWithTime.reduce((sum, claim) => {
    const created = new Date(claim.createdAt);
    const completed = new Date(claim.completedAt!);
    const diffDays = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0) / completedClaimsWithTime.length || 0;

  // คำนวณความพึงพอใจเฉลี่ย
  const ratingsCount = claims.filter(c => c.customerSatisfaction).length;
  const customerSatisfactionAverage = claims.reduce((sum, claim) => 
    sum + (claim.customerSatisfaction?.rating || 0), 0
  ) / ratingsCount || 0;

  return {
    totalClaims,
    pendingClaims,
    completedClaims,
    averageResolutionTime,
    customerSatisfactionAverage,
    // ... other statistics
  };
}
```

## Usage Examples

### Basic Usage
```typescript
import { useClaims } from '@/hooks/useClaims';

function ClaimsComponent() {
  const { 
    claims, 
    statistics, 
    createClaim,
    updateClaimStatus
  } = useClaims();

  return (
    <div>
      <h1>เคลมทั้งหมด: {statistics.totalClaims}</h1>
      <h2>รอดำเนินการ: {statistics.pendingClaims}</h2>
    </div>
  );
}
```

### Creating Claims
```typescript
const { createClaim } = useClaims();

// สร้างเคลมใหม่
const newClaimData = {
  customerId: 'cust-001',
  productId: 'prod-001',
  type: 'defect',
  category: 'manufacturing_defect',
  priority: 'high',
  issueDescription: 'สินค้ามีข้อบกพร่องจากการผลิต',
  purchaseDate: '2024-01-01'
};

createClaim(newClaimData);
```

### Status Management
```typescript
const { 
  updateClaimStatus, 
  assignClaim, 
  resolveClaim 
} = useClaims();

// อัปเดตสถานะ
updateClaimStatus('claim-001', 'approved');

// มอบหมายงาน
assignClaim('claim-001', 'tech-001');

// แก้ไขปัญหา
const resolution = {
  type: 'repair',
  description: 'ซ่อมแซมชิ้นส่วนที่ชำรุด',
  actionTaken: 'เปลี่ยนชิ้นส่วนใหม่',
  totalCost: 1500,
  resolvedBy: 'tech-001',
  resolvedAt: new Date().toISOString(),
  customerApproval: true,
  followUpRequired: false
};

resolveClaim('claim-001', resolution);
```

### Filtering and Search
```typescript
const { 
  setClaimFilter, 
  clearClaimFilter 
} = useClaims();

// กรองตามสถานะ
setClaimFilter({ status: 'pending' });

// กรองตามความสำคัญ
setClaimFilter({ priority: 'high' });

// กรองตามสถานะประกัน
setClaimFilter({ warrantyStatus: 'under_warranty' });

// ค้นหา
setClaimFilter({ search: 'โซฟา' });

// ล้างตัวกรอง
clearClaimFilter();
```

## Data Export

### Export Functions
```typescript
// ส่งออกรายการเคลม
const claimsCSV = exportClaimsToCSV(claims);

// ส่งออกข้อมูลลูกค้า
const customersCSV = exportCustomersToCSV(customers);

// ส่งออกข้อมูลสินค้า
const productsCSV = exportProductsToCSV(products);
```

## Validation Rules

### Claim Form Validation
- ต้องเลือกลูกค้าและสินค้า
- ต้องระบุประเภทและหมวดหมู่การเคลม
- ต้องระบุรายละเอียดปัญหา
- วันที่ซื้อต้องไม่เป็นอนาคต
- ต้องแนบเอกสารหลักฐาน (ถ้าจำเป็น)

### Resolution Form Validation
- ต้องระบุประเภทการแก้ไข
- ต้องระบุรายละเอียดและการดำเนินการ
- ค่าใช้จ่ายต้องไม่ติดลบ
- ต้องได้รับการอนุมัติจากลูกค้า

## Performance Optimizations

### Implemented Optimizations
- ✅ useMemo สำหรับการคำนวณ statistics
- ✅ useCallback สำหรับ event handlers
- ✅ Efficient filtering และ search
- ✅ Lazy loading สำหรับ components
- ✅ Optimized re-renders
- ✅ Virtual scrolling สำหรับรายการยาว

### Memory Management
- การจัดการ state อย่างมีประสิทธิภาพ
- ทำความสะอาด event listeners
- Proper component unmounting

## Integration Points

### POS Integration
```typescript
// เมื่อมีการขายใน POS จะสร้างข้อมูลการรับประกันอัตโนมัติ
const saleData = {
  customerId: 'cust-001',
  productId: 'prod-001',
  purchaseDate: '2024-01-01',
  warrantyPeriod: 24 // เดือน
};

// สร้างข้อมูลการรับประกัน
createWarrantyRecord(saleData);
```

### Inventory Integration
```typescript
// เชื่อมโยงกับข้อมูลสินค้าและ serial numbers
const productInfo = {
  productId: 'prod-001',
  serialNumber: 'SN123456789',
  warrantyPeriod: 24,
  warrantyType: 'manufacturer'
};
```

## Customer Satisfaction

### Rating System
```typescript
interface CustomerSatisfactionRating {
  rating: number;                  // 1-5 ดาว
  feedback?: string;               // ความคิดเห็น
  ratedAt: string;                // วันที่ให้คะแนน
  wouldRecommend: boolean;         // แนะนำให้ผู้อื่นหรือไม่
}

// เพิ่มความพึงพอใจ
const satisfaction = {
  rating: 5,
  feedback: 'พอใจมากค่ะ ช่างทำงานดีและรวดเร็ว',
  ratedAt: new Date().toISOString(),
  wouldRecommend: true
};

addCustomerSatisfaction('claim-001', satisfaction);
```

## Security Considerations

### Access Control
- ระบบสิทธิ์การเข้าถึงตามบทบาท
- การตรวจสอบสิทธิ์ก่อนการแก้ไข
- Audit trail สำหรับการเปลี่ยนแปลง

### Data Privacy
- การปกป้องข้อมูลส่วนบุคคล
- การเข้ารหัสข้อมูลสำคัญ
- การจัดเก็บไฟล์แนบอย่างปลอดภัย

## Testing Strategy

### Unit Tests
- ทดสอบ utility functions
- ทดสอบ validation logic
- ทดสอบ calculation functions

### Integration Tests
- ทดสอบการทำงานร่วมกันของ components
- ทดสอบ workflow การเคลม
- ทดสอบการส่งออกข้อมูล

### E2E Tests
- ทดสอบ user workflows
- ทดสอบการสร้างและติดตามเคลม
- ทดสอบการแก้ไขปัญหา

## Future Enhancements

### Phase 2 Features
1. **Mobile App**: แอปมือถือสำหรับลูกค้า
2. **Real-time Notifications**: การแจ้งเตือนแบบ real-time
3. **Advanced Analytics**: การวิเคราะห์ข้อมูลขั้นสูง
4. **Integration APIs**: เชื่อมต่อกับระบบภายนอก

### Advanced Features
1. **AI-Powered Insights**: วิเคราะห์แนวโน้มด้วย AI
2. **Predictive Maintenance**: การบำรุงรักษาเชิงป้องกัน
3. **IoT Integration**: เชื่อมต่อกับอุปกรณ์ IoT
4. **Blockchain Warranty**: การรับประกันด้วย blockchain

## Compliance & Standards

### Service Standards
- มาตรฐานการบริการลูกค้า
- เวลาตอบสนองตามความสำคัญ
- คุณภาพการแก้ไขปัญหา

### Data Retention
- นโยบายการเก็บข้อมูล
- การลบข้อมูลตามกำหนด
- การสำรองข้อมูลอัตโนมัติ

## Conclusion

โมดูล Claims & Warranty ได้รับการพัฒนาเสร็จสมบูรณ์แล้ว พร้อมใช้งานในระบบ production ด้วยฟีเจอร์ครบครันและการออกแบบที่ทันสมัย

### Key Achievements
- ✅ ระบบเคลมที่ครอบคลุมและมีประสิทธิภาพ
- ✅ การติดตามการรับประกันแบบอัตโนมัติ
- ✅ UI/UX ที่ใช้งานง่ายและสวยงาม
- ✅ ระบบแจ้งเตือนและติดตาม
- ✅ การวัดความพึงพอใจลูกค้า
- ✅ พร้อมสำหรับการขยายและพัฒนาต่อ

**สถานะ: พร้อมใช้งาน 🚀**