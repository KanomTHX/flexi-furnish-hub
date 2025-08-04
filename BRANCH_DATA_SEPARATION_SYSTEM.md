# ระบบแยกข้อมูลตามสาขา (Branch Data Separation System)

## ภาพรวมระบบ

ระบบนี้ได้รับการออกแบบเพื่อแยกข้อมูลทั้งระบบตามสาขาทั้ง 4 สาขา ได้แก่:

1. **ไผ่ท่าโพ (PTH)** - สาขาหลัก
2. **บางมูลนาก (BMN)** - สาขา
3. **ทับคล้อ (TKL)** - สาขา  
4. **อุตรดิตถ์ (UTD)** - สาขา

## โครงสร้างระบบ

### 1. Branch Types และ Data Models

#### Branch Interface
```typescript
interface Branch {
  id: string;
  code: string; // PTH, BMN, TKL, UTD
  name: string;
  type: 'main' | 'branch' | 'outlet' | 'warehouse';
  status: 'active' | 'inactive' | 'maintenance';
  
  // Location & Contact Information
  address: BranchAddress;
  contact: BranchContact;
  businessInfo: BranchBusinessInfo;
  
  // Settings & Permissions
  settings: BranchSettings;
  permissions: BranchPermissions;
  
  // Statistics
  stats: BranchStats;
}
```

#### Data Isolation Levels
- **Strict**: ข้อมูลแยกสมบูรณ์ ไม่สามารถเข้าถึงข้อมูลสาขาอื่นได้
- **Partial**: สามารถดูข้อมูลสาขาอื่นได้บางส่วน (เฉพาะรายงาน)
- **Shared**: สามารถเข้าถึงข้อมูลทุกสาขาได้ (สำหรับสาขาหลัก)

### 2. Branch-Specific Data Types

#### BranchStock
```typescript
interface BranchStock extends StockLevel {
  branchId: string;
  branchCode: string;
  branchName: string;
  isSharedWithBranches?: string[];
  transferRestrictions?: TransferRestrictions;
}
```

#### BranchEmployee
```typescript
interface BranchEmployee {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  // ... employee data
  permissions: {
    dataAccessLevel: 'own_branch' | 'selected_branches' | 'all_branches';
    accessibleBranches?: string[];
  };
}
```

#### BranchCustomer
```typescript
interface BranchCustomer {
  id: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  // ... customer data
}
```

### 3. Data Context และ Permissions

#### BranchDataContext
```typescript
interface BranchDataContext {
  currentBranch: Branch;
  accessibleBranches: Branch[];
  userPermissions: {
    canSwitchBranch: boolean;
    canViewAllBranches: boolean;
    canManageBranches: boolean;
    allowedOperations: string[];
  };
}
```

## คุณสมบัติหลัก

### 1. Branch Selector Component
- เลือกสาขาเดียวหรือหลายสาขา
- แสดงสถิติของแต่ละสาขา
- ตรวจสอบสิทธิ์การเข้าถึง
- รองรับการเปลี่ยนสาขาแบบ Real-time

### 2. Branch Dashboard
- แสดงข้อมูลสาขาปัจจุบัน
- เปรียบเทียบประสิทธิภาพระหว่างสาขา
- สถิติแบบ Real-time
- การวิเคราะห์ข้อมูลเชิงลึก

### 3. Data Isolation System
- แยกข้อมูลตาม Branch ID
- ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
- รองรับการโอนข้อมูลระหว่างสาขา
- ระบบ Audit Trail สำหรับการเข้าถึงข้อมูล

### 4. Branch Management
- จัดการข้อมูลสาขา
- ตั้งค่าสิทธิ์และการเข้าถึง
- การซิงค์ข้อมูลระหว่างสาขา
- รายงานเปรียบเทียบสาขา

## การใช้งาน

### 1. useBranchData Hook
```typescript
const {
  currentBranch,
  branchSummary,
  currentBranchStock,
  currentBranchEmployees,
  currentBranchCustomers,
  switchBranch,
  canAccessBranchData
} = useBranchData();
```

### 2. Branch Selector
```typescript
<BranchSelector
  allowMultiSelect={true}
  showStats={true}
  onBranchChange={(branchId) => console.log('Selected:', branchId)}
/>
```

### 3. Data Filtering
```typescript
// ข้อมูลสาขาปัจจุบัน
const currentData = getCurrentBranchData(allData);

// ข้อมูลสาขาที่เลือก
const selectedData = getSelectedBranchesData(allData);

// ตรวจสอบสิทธิ์
const canAccess = canAccessBranchData(branchId);
```

## การแยกข้อมูลในแต่ละโมดูล

### 1. Stock Management
- สต็อกแยกตามสาขา
- การโอนสต็อกระหว่างสาขา
- แจ้งเตือนสต็อกต่ำแยกตามสาขา
- รายงานการเคลื่อนไหวสต็อกตามสาขา

### 2. Sales & POS
- ยอดขายแยกตามสาขา
- ลูกค้าแยกตามสาขา
- รายงานการขายตามสาขา
- เปรียบเทียบประสิทธิภาพการขาย

### 3. Employee Management
- พนักงานแยกตามสาขา
- สิทธิ์การเข้าถึงข้อมูลตามสาขา
- การประเมินผลงานตามสาขา
- การโอนพนักงานระหว่างสาขา

### 4. Financial & Accounting
- บัญชีแยกตามสาขา
- รายได้-รายจ่ายตามสาขา
- งบการเงินรวมและแยกสาขา
- การวิเคราะห์ความสามารถในการทำกำไร

### 5. Reports & Analytics
- รายงานแยกตามสาขา
- เปรียบเทียบประสิทธิภาพสาขา
- การวิเคราะห์แนวโน้มตามสาขา
- Dashboard แบบ Multi-branch

## ความปลอดภัยและการควบคุม

### 1. Access Control
- Role-based permissions ตามสาขา
- Data isolation ตาม user role
- Audit logging สำหรับการเข้าถึงข้อมูล
- Session management แยกตามสาขา

### 2. Data Transfer Security
- การเข้ารหัสข้อมูลระหว่างการโอน
- การตรวจสอบความถูกต้องของข้อมูล
- Backup และ Recovery แยกตามสาขา
- การซิงค์ข้อมูลแบบปลอดภัย

## การส่งออกข้อมูล

### 1. Branch-specific Export
```typescript
// ส่งออกข้อมูลสาขาเดียว
exportBranchData([branchId]);

// ส่งออกข้อมูลเปรียบเทียบ
exportBranchComparison();
```

### 2. รูปแบบการส่งออก
- CSV สำหรับข้อมูลตาราง
- PDF สำหรับรายงาน
- Excel สำหรับการวิเคราะห์
- JSON สำหรับการนำเข้าระบบอื่น

## การติดตั้งและการใช้งาน

### 1. Components ที่เพิ่มใหม่
- `src/types/branch.ts` - Type definitions
- `src/data/mockBranchData.ts` - Mock data
- `src/hooks/useBranchData.ts` - Data management hook
- `src/components/branch/BranchSelector.tsx` - Branch selection
- `src/components/branch/BranchDashboard.tsx` - Branch dashboard
- `src/pages/BranchManagement.tsx` - Branch management page

### 2. การอัปเดต Components เดิม
- `src/components/dashboard/RealTimeStats.tsx` - รองรับข้อมูลแยกสาขา
- `src/components/navigation/AdminSidebar.tsx` - เพิ่มเมนูจัดการสาขา
- `src/App.tsx` - เพิ่ม routing สำหรับหน้าจัดการสาขา

### 3. การใช้งาน
1. เข้าไปที่เมนู "จัดการสาขา"
2. เลือกสาขาที่ต้องการดูข้อมูล
3. ใช้ Tab ต่างๆ เพื่อดูข้อมูลและเปรียบเทียบ
4. ส่งออกข้อมูลตามต้องการ

## ข้อดีของระบบ

### 1. Data Isolation
- ข้อมูลแยกชัดเจนตามสาขา
- ความปลอดภัยของข้อมูลสูง
- การจัดการสิทธิ์ที่ยืดหยุ่น

### 2. Performance
- โหลดข้อมูลเฉพาะสาขาที่ต้องการ
- ลดการใช้ bandwidth
- การตอบสนองที่เร็วขึ้น

### 3. Scalability
- เพิ่มสาขาใหม่ได้ง่าย
- รองรับการขยายระบบ
- การจัดการข้อมูลที่มีประสิทธิภาพ

### 4. User Experience
- Interface ที่ใช้งานง่าย
- การเปลี่ยนสาขาแบบ Real-time
- ข้อมูลที่เกี่ยวข้องและแม่นยำ

## การพัฒนาต่อ

### 1. Features ที่สามารถเพิ่มได้
- การซิงค์ข้อมูลแบบ Real-time
- Mobile app สำหรับแต่ละสาขา
- API สำหรับระบบภายนอก
- Advanced analytics และ AI

### 2. การปรับปรุงประสิทธิภาพ
- Database indexing ตาม branch_id
- Caching ข้อมูลสาขา
- Lazy loading สำหรับข้อมูลขนาดใหญ่
- Background sync processes

## สรุป

ระบบแยกข้อมูลตามสาขานี้ให้ความยืดหยุ่นในการจัดการข้อมูลของธุรกิจที่มีหลายสาขา โดยรักษาความปลอดภัยและประสิทธิภาพของระบบ พร้อมทั้งให้ประสบการณ์การใช้งานที่ดีสำหรับผู้ใช้ในแต่ละสาขา