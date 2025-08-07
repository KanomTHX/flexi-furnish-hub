# 📋 สรุปการอัปเดต Column Names

## ✅ ไฟล์ที่อัปเดตแล้ว

### 1. **src/lib/supabase-installments.ts** (ไฟล์ใหม่)
- ฟังก์ชันจัดการสัญญาผ่อนชำระที่ใช้ column names ที่ถูกต้อง
- `createInstallmentContract()` - สร้างสัญญาใหม่
- `getInstallmentContracts()` - ดึงรายการสัญญา
- `createPaymentSchedule()` - สร้างตารางการชำระเงิน
- `getContractPayments()` - ดึงการชำระเงินของสัญญา
- `recordPayment()` - บันทึกการชำระเงิน

### 2. **src/components/installments/InstallmentDialog.tsx**
- อัปเดต `handleConfirm()` ให้ใช้ฟังก์ชันใหม่
- เปลี่ยนจาก sync เป็น async function
- เพิ่ม error handling

### 3. **src/types/installments.ts**
- อัปเดต `InstallmentContract` interface
  - เพิ่ม `transactionId`, `remainingAmount`
  - เปลี่ยน status จาก `'draft'` เป็น `'pending'`
- อัปเดต `InstallmentPayment` interface
  - เพิ่ม `installmentPlanId`
  - อัปเดต field mappings

### 4. **src/utils/installmentHelpers.ts** (ไฟล์ใหม่)
- ฟังก์ชันช่วยเหลือที่อัปเดตแล้ว
- `checkInstallmentEligibility()` - ตรวจสอบสิทธิ์
- `calculateMonthlyPayment()` - คำนวณค่างวด
- `requiresGuarantor()` - ตรวจสอบความต้องการผู้ค้ำ
- `calculateLateFee()` - คำนวณค่าปรับ

## 🔄 Column Name Mappings

### installment_contracts
```typescript
// Frontend -> Database
contractNumber -> contract_number
customerId -> customer_id
planId -> plan_id
guarantorId -> guarantor_id
financedAmount -> financed_amount
totalInterest -> total_interest
processingFee -> processing_fee
totalPayable -> total_payable
contractDate -> contract_date
firstPaymentDate -> first_payment_date
lastPaymentDate -> last_payment_date
paidInstallments -> paid_installments
remainingInstallments -> remaining_installments
totalPaid -> total_paid
remainingBalance -> remaining_balance
createdBy -> created_by
approvedBy -> approved_by
approvedAt -> approved_at
branchId -> branch_id

// Status values
'draft' -> 'pending'
```

### installment_payments
```typescript
// Frontend -> Database
contractId -> contract_id
installmentPlanId -> installment_plan_id
installmentNumber -> payment_number
amount -> amount_due
paidDate -> payment_date
paidAmount -> amount_paid
receiptNumber -> receipt_number
lateFee -> late_fee
principalAmount -> principal_amount
interestAmount -> interest_amount
processedBy -> processed_by
branchId -> branch_id
```

### guarantors
```typescript
// Frontend -> Database
idCard -> id_card
monthlyIncome -> monthly_income
workAddress -> work_address
emergencyContact.name -> emergency_contact_name
emergencyContact.phone -> emergency_contact_phone
emergencyContact.relationship -> emergency_contact_relationship
createdBy -> created_by
updatedBy -> updated_by
branchId -> branch_id
```

## 🎯 การใช้งานใหม่

### สร้างสัญญาผ่อนชำระ
```typescript
import { createInstallmentContract } from '@/lib/supabase-installments';

const contract = await createInstallmentContract({
  customer: customerData,
  plan: selectedPlan,
  totalAmount: contractAmount,
  downPayment: downPaymentAmount,
  guarantorId: guarantor?.id,
  collateral: collateralInfo,
  terms: specialTerms,
  notes: additionalNotes
});
```

### ดึงการชำระเงิน
```typescript
import { getContractPayments } from '@/lib/supabase-installments';

const payments = await getContractPayments(contractId);
```

### บันทึกการชำระเงิน
```typescript
import { recordPayment } from '@/lib/supabase-installments';

const payment = await recordPayment(
  paymentId,
  paidAmount,
  paymentMethod,
  receiptNumber
);
```

## 🚨 สิ่งสำคัญที่ต้องจำ

### Required Fields ในฐานข้อมูล
```sql
-- installment_contracts
contract_number (NOT NULL)
transaction_id (NOT NULL)
down_payment (NOT NULL)
remaining_amount (NOT NULL)
monthly_payment (NOT NULL)

-- installment_payments
payment_number (NOT NULL)
amount_due (NOT NULL)
```

### Status Values ที่ถูกต้อง
```typescript
// installment_contracts.status
'pending' | 'active' | 'completed' | 'defaulted' | 'cancelled'

// installment_payments.status
'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled'
```

### Foreign Key References
```sql
-- installment_contracts
customer_id -> customers.id
plan_id -> installment_plans.id
guarantor_id -> guarantors.id

-- installment_payments
contract_id -> installment_contracts.id
installment_plan_id -> installment_plans.id
```

## 🔧 ขั้นตอนต่อไป

1. **รัน SQL Migration**
   ```sql
   -- ใช้ไฟล์ CORRECTED_INSTALLMENT_MIGRATION.sql
   ```

2. **ทดสอบการสร้างสัญญา**
   - เปิดหน้า Installments
   - กดปุ่ม "สร้างสัญญาใหม่"
   - ทดสอบ workflow ทั้ง 5 ขั้นตอน

3. **ตรวจสอบข้อมูลในฐานข้อมูล**
   - ตรวจสอบว่าสัญญาถูกสร้างใน `installment_contracts`
   - ตรวจสอบว่าตารางการชำระถูกสร้างใน `installment_payments`

## ✅ ผลลัพธ์ที่คาดหวัง

หลังจากการอัปเดตนี้:
- ระบบจะสามารถสร้างสัญญาผ่อนชำระได้สำเร็จ
- ข้อมูลจะถูกบันทึกในฐานข้อมูลด้วย column names ที่ถูกต้อง
- ระบบตรวจสอบผู้ค้ำประกันอัตโนมัติจะทำงานได้
- การคำนวณค่างวดและดอกเบี้ยจะถูกต้อง
- ตารางการชำระเงินจะถูกสร้างอัตโนมัติ