# การเชื่อมต่อระบบเช่าซื้อกับระบบบัญชี (Installment-Accounting Integration)

## ภาพรวม
ระบบนี้เชื่อมต่อระบบเช่าซื้อ (Installment System) เข้ากับระบบบัญชี (Accounting System) เพื่อบันทึกรายการทางบัญชีอัตโนมัติเมื่อมีการสร้างสัญญาเช่าซื้อและการชำระงวด

## ไฟล์ที่สร้าง/แก้ไข

### 1. Service Layer
- **`src/services/installmentAccountingIntegration.ts`** - Service หลักสำหรับการเชื่อมต่อ
  - สร้างรายการบัญชีจากสัญญาเช่าซื้อ
  - สร้างรายการบัญชีจากการชำระงวด
  - จัดการ Chart of Accounts สำหรับเช่าซื้อ
  - ดึงและลบรายการบัญชีที่เกี่ยวข้อง

### 2. Custom Hooks
- **`src/hooks/useInstallmentAccountingIntegration.ts`** - Hook สำหรับจัดการการเชื่อมต่อ
  - State management สำหรับการประมวลผล
  - Error handling
  - Interface สำหรับ UI components

### 3. Enhanced Existing Hooks
- **`src/hooks/useInstallments.ts`** - เพิ่มการเชื่อมต่อกับระบบบัญชี
  - Auto-create accounting entries เมื่อสร้างสัญญาใหม่
  - Auto-create accounting entries เมื่อบันทึกการชำระเงิน
  - เพิ่ม state สำหรับ accounting processing

- **`src/hooks/useInstallmentPayments.ts`** - เพิ่มการเชื่อมต่อกับระบบบัญชี
  - Auto-create accounting entries เมื่อบันทึกการชำระเงิน
  - การแปลงข้อมูลระหว่าง database format และ unified types
  - Error handling แยกระหว่าง payment และ accounting

## Chart of Accounts สำหรับระบบเช่าซื้อ

### Assets (สินทรัพย์)
- **1100** - เงินสด (Cash)
- **1110** - เงินฝากธนาคาร (Bank Account)
- **1120** - เงินโอน (Transfer Account)
- **1300** - ลูกหนี้การค้า (Accounts Receivable)

### Revenue (รายได้)
- **4100** - รายได้จากการขาย (Sales Revenue)
- **4200** - รายได้ดอกเบี้ย (Interest Revenue)

## ตรรกะทางบัญชี

### 1. การสร้างสัญญาเช่าซื้อ

#### เมื่อมีเงินดาวน์:
```
Dr. เงินสด/ธนาคาร     xxx
    Cr. รายได้จากการขาย     xxx
```

#### บันทึกลูกหนี้เช่าซื้อ:
```
Dr. ลูกหนี้การค้า      xxx
    Cr. รายได้จากการขาย     xxx
```

### 2. การชำระงวด

#### รับชำระเงิน:
```
Dr. เงินสด/ธนาคาร     xxx
    Cr. ลูกหนี้การค้า       xxx (ส่วนต้นทุน)
    Cr. รายได้ดอกเบี้ย      xxx (ส่วนดอกเบี้ย)
```

## คุณสมบัติหลัก

### 1. การบันทึกรายการอัตโนมัติ
- สร้างรายการบัญชีทันทีเมื่อสร้างสัญญาเช่าซื้อ
- สร้างรายการบัญชีทันทีเมื่อมีการชำระงวด
- รองรับการชำระเงินหลายรูปแบบ (เงินสด, โอน, บัตรเครดิต)

### 2. การคำนวณอัตโนมัติ
- แยกส่วนต้นทุนและดอกเบี้ยในแต่ละงวด
- คำนวณยอดลูกหนี้คงเหลือ
- ติดตามสถานะการชำระเงิน

### 3. การจัดการข้อมูล
- ดึงรายการบัญชีที่เกี่ยวข้องกับสัญญา
- ดึงรายการบัญชีที่เกี่ยวข้องกับการชำระเงิน
- ลบรายการบัญชีเมื่อยกเลิกสัญญา

### 4. Error Handling
- แยก error handling ระหว่าง payment และ accounting
- ไม่ให้ accounting error กระทบการบันทึกการชำระเงิน
- Logging สำหรับ debugging

## ตัวเลือกการกำหนดค่า

### InstallmentAccountingIntegrationOptions
```typescript
{
  autoCreateAccountingEntry?: boolean;     // เปิด/ปิดการสร้างรายการอัตโนมัติ
  defaultReceivableAccountId?: string;     // บัญชีลูกหนี้เริ่มต้น
  defaultInterestRevenueAccountId?: string; // บัญชีรายได้ดอกเบี้ยเริ่มต้น
  defaultCashAccountId?: string;           // บัญชีเงินสดเริ่มต้น
  defaultCardAccountId?: string;           // บัญชีบัตรเครดิตเริ่มต้น
  defaultTransferAccountId?: string;       // บัญชีเงินโอนเริ่มต้น
  vatRate?: number;                        // อัตราภาษีมูลค่าเพิ่ม
  includeVAT?: boolean;                    // รวมภาษีมูลค่าเพิ่มหรือไม่
  roundingPrecision?: number;              // ทศนิยมสำหรับการปัดเศษ
}
```

## ตัวอย่างการใช้งาน

### 1. ใน Component สำหรับสร้างสัญญา
```typescript
import { useInstallments } from '@/hooks/useInstallments';

function InstallmentContractForm() {
  const { actions, isAccountingProcessing, accountingError } = useInstallments();
  
  const handleCreateContract = async (contractData) => {
    // สร้างสัญญา - จะสร้างรายการบัญชีอัตโนมัติ
    await actions.addContract(contractData);
  };
  
  return (
    <div>
      {isAccountingProcessing && <div>กำลังสร้างรายการบัญชี...</div>}
      {accountingError && <div>Error: {accountingError}</div>}
      {/* Form UI */}
    </div>
  );
}
```

### 2. ใน Component สำหรับบันทึกการชำระเงิน
```typescript
import { useInstallmentPayments } from '@/hooks/useInstallmentPayments';

function PaymentForm() {
  const { 
    recordPayment, 
    isAccountingProcessing, 
    accountingError 
  } = useInstallmentPayments();
  
  const handlePayment = async (paymentData) => {
    // บันทึกการชำระเงิน - จะสร้างรายการบัญชีอัตโนมัติ
    const result = await recordPayment(paymentData);
  };
  
  return (
    <div>
      {isAccountingProcessing && <div>กำลังสร้างรายการบัญชี...</div>}
      {accountingError && <div>Error: {accountingError}</div>}
      {/* Payment Form UI */}
    </div>
  );
}
```

### 3. การใช้งาน Service โดยตรง
```typescript
import { installmentAccountingIntegration } from '@/services/installmentAccountingIntegration';

// สร้างรายการบัญชีจากสัญญา
const result = await installmentAccountingIntegration
  .createAccountingEntriesFromInstallmentContract(contract, {
    defaultCashAccountId: '1100',
    defaultReceivableAccountId: '1300'
  });

// สร้างรายการบัญชีจากการชำระเงิน
const paymentResult = await installmentAccountingIntegration
  .createAccountingEntriesFromInstallmentPayment(payment, contract);
```

## การทดสอบ

### 1. ทดสอบการสร้างสัญญา
- สร้างสัญญาเช่าซื้อใหม่
- ตรวจสอบว่ามีรายการบัญชีถูกสร้างใน `accounting_transactions`
- ตรวจสอบยอดเงินในบัญชีต่างๆ

### 2. ทดสอบการชำระเงิน
- บันทึกการชำระงวด
- ตรวจสอบการแยกส่วนต้นทุนและดอกเบี้ย
- ตรวจสอบการอัพเดทยอดลูกหนี้

### 3. ทดสอบ Error Handling
- ทดสอบเมื่อ accounting service ล้มเหลว
- ตรวจสอบว่าการชำระเงินยังสำเร็จ
- ตรวจสอบ error messages

## หมายเหตุ

### ข้อจำกัด
- ยังไม่รองรับการแก้ไขรายการบัญชีที่สร้างแล้ว
- การคำนวณดอกเบี้ยใช้สูตรแบบง่าย (80% ต้นทุน, 20% ดอกเบี้ย)
- ยังไม่มีการ validate Chart of Accounts

### การพัฒนาต่อ
- เพิ่มการรองรับ VAT calculation
- เพิ่มการ validate account codes
- เพิ่มการสร้างรายงานทางการเงินเฉพาะเช่าซื้อ
- เพิ่มการจัดการ reversal entries

## สถานะการพัฒนา
✅ **เสร็จสมบูรณ์** - การเชื่อมต่อระบบเช่าซื้อกับระบบบัญชีพร้อมใช้งาน

---
*อัพเดทล่าสุด: มกราคม 2025*