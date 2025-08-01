# Installments Module

## ภาพรวม
Installments Module เป็นระบบจัดการสัญญาผ่อนชำระแบบครบวงจร สำหรับร้านเฟอร์นิเจอร์ รองรับการสร้างสัญญา ติดตามการชำระเงิน และการจัดการความเสี่ยง

## ฟีเจอร์หลัก

### 📋 การจัดการสัญญาผ่อนชำระ
- สร้างสัญญาผ่อนชำระใหม่
- ตรวจสอบสิทธิ์ลูกค้าอัตโนมัติ
- เลือกแผนผ่อนที่เหมาะสม
- คำนวณค่างวดและดอกเบี้ยอัตโนมัติ
- จัดการผู้ค้ำประกันและหลักประกัน

### 💰 ระบบการชำระเงิน
- ติดตามการชำระเงินรายงวด
- บันทึกการรับชำระเงิน
- คำนวณค่าปรับล่าช้าอัตโนมัติ
- อัพเดทสถานะสัญญาแบบ real-time
- ระบบแจ้งเตือนการครบกำหนด

### 📊 รายงานและสถิติ
- สรุปข้อมูলสัญญาทั้งหมด
- ยอดให้เครดิตและยอดเก็บแล้ว
- ติดตามยอดค้างชำระ
- วิเคราะห์ความเสี่ยง
- อัตราการชำระตรงเวลา

### 👥 การจัดการลูกค้า
- ข้อมูลลูกค้าแบบละเอียด
- ประวัติการชำระเงิน
- คะแนนเครดิต
- การจัดกลุ่มลูกค้า

## แผนผ่อนชำระ

### แผนมาตรฐาน
1. **ผ่อน 3 เดือน (ไม่มีดอกเบี้ย)**
   - ระยะเวลา: 3 งวด
   - อัตราดอกเบี้ย: 0% ต่อปี
   - เงินดาวน์: 30%
   - ค่าธรรมเนียม: 500 บาท

2. **ผ่อน 6 เดือน (ดอกเบี้ย 5%)**
   - ระยะเวลา: 6 งวด
   - อัตราดอกเบี้ย: 5% ต่อปี
   - เงินดาวน์: 20%
   - ค่าธรรมเนียม: 800 บาท

3. **ผ่อน 12 เดือน (ดอกเบี้ย 8%)**
   - ระยะเวลา: 12 งวด
   - อัตราดอกเบี้ย: 8% ต่อปี
   - เงินดาวน์: 15%
   - ค่าธรรมเนียม: 1,200 บาท

4. **ผ่อน 18 เดือน (ดอกเบี้ย 10%)**
   - ระยะเวลา: 18 งวด
   - อัตราดอกเบี้ย: 10% ต่อปี
   - เงินดาวน์: 10%
   - ค่าธรรมเนียม: 1,500 บาท

5. **ผ่อน 24 เดือน (ดอกเบี้ย 12%)**
   - ระยะเวลา: 24 งวด
   - อัตราดอกเบี้ย: 12% ต่อปี
   - เงินดาวน์: 10%
   - ค่าธรรมเนียม: 2,000 บาท

6. **ผ่อน 36 เดือน (ดอกเบี้ย 15%)**
   - ระยะเวลา: 36 งวด
   - อัตราดอกเบี้ย: 15% ต่อปี
   - เงินดาวน์: 5%
   - ค่าธรรมเนียม: 2,500 บาท

### แผนพิเศษ
7. **แพ็คเกจ VIP (ไม่มีดอกเบี้ย)**
   - ระยะเวลา: 12 งวด
   - อัตราดอกเบี้ย: 0% ต่อปี
   - เงินดาวน์: 50%
   - ค่าธรรมเนียม: 0 บาท
   - สำหรับลูกค้า VIP

8. **แพ็คเกจนักเรียน/นักศึกษา**
   - ระยะเวลา: 6 งวด
   - อัตราดอกเบี้ย: 3% ต่อปี
   - เงินดาวน์: 25%
   - ค่าธรรมเนียม: 300 บาท

## การตรวจสอบสิทธิ์

### เกณฑ์การอนุมัติ
- **ข้อมูลพื้นฐาน**: ชื่อ, เบอร์โทร, ที่อยู่, เลขบัตรประชาชน
- **สถานะบัญชีดำ**: ไม่อยู่ในบัญชีดำ
- **รายได้**: วงเงินสูงสุด 10 เท่าของรายได้ต่อเดือน
- **คะแนนเครดิต**: ขั้นต่ำ 600 คะแนน (ถ้ามี)

### ข้อมูลที่ต้องการ
- เลขบัตรประชาชน
- อาชีพและสถานที่ทำงาน
- รายได้ต่อเดือน
- ที่อยู่ปัจจุบันและที่ทำงาน
- ผู้ติดต่อฉุกเฉิน
- ผู้ค้ำประกัน (ถ้าจำเป็น)

## โครงสร้างไฟล์

```
src/
├── pages/
│   └── Installments.tsx            # หน้าหลัก Installments
├── components/installments/
│   ├── InstallmentDialog.tsx       # หน้าต่างสร้างสัญญา
│   └── InstallmentManagement.tsx   # จัดการสัญญา
├── hooks/
│   └── useInstallments.ts          # จัดการ state สัญญา
├── types/
│   └── pos.ts                      # TypeScript types
├── data/
│   └── mockInstallmentPlans.ts     # แผนผ่อนชำระ
└── utils/
    └── installmentHelpers.ts       # ฟังก์ชันช่วย
```

## การใช้งาน

### 1. สร้างสัญญาใหม่
1. คลิก "สร้างสัญญาใหม่"
2. กรอกข้อมูลลูกค้าให้ครบถ้วน
3. ระบบตรวจสอบสิทธิ์อัตโนมัติ
4. เลือกแผนผ่อนที่เหมาะสม
5. กรอกข้อมูลผู้ค้ำประกัน (ถ้าต้องการ)
6. ตรวจสอบและยืนยันสัญญา

### 2. จัดการสัญญา
1. ดูรายการสัญญาทั้งหมด
2. ค้นหาด้วยเลขที่สัญญา, ชื่อลูกค้า, หรือเบอร์โทร
3. กรองตามสถานะสัญญา
4. คลิก "ดู" เพื่อดูรายละเอียด

### 3. รับชำระเงิน
1. เปิดรายละเอียดสัญญา
2. ไปที่แท็บ "ตารางการชำระ"
3. คลิก "รับชำระ" ในงวดที่ต้องการ
4. กรอกจำนวนเงินที่รับ
5. ยืนยันการรับชำระ

### 4. ดูรายงาน
1. ไปที่แท็บ "รายงาน"
2. ดูสถิติการชำระเงิน
3. วิเคราะห์ความเสี่ยง
4. ส่งออกข้อมูลเป็น CSV

## การคำนวณ

### ค่างวดรายเดือน
```typescript
const monthlyRate = annualRate / 100 / 12;
const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                      (Math.pow(1 + monthlyRate, months) - 1);
```

### ดอกเบี้ยรวม
```typescript
const totalInterest = (monthlyPayment * months) - principal;
```

### ค่าปรับล่าช้า
```typescript
const lateFee = amount * 0.05 * (daysLate / 30); // 5% ต่อเดือน
```

## สถานะสัญญา

- **ร่าง (Draft)**: สัญญาที่ยังไม่ได้อนุมัติ
- **ใช้งาน (Active)**: สัญญาที่กำลังผ่อนชำระ
- **เสร็จสิ้น (Completed)**: ชำระครบแล้ว
- **ผิดนัด (Defaulted)**: มีการค้างชำระเกินกำหนด
- **ยกเลิก (Cancelled)**: ยกเลิกสัญญา

## สถานะการชำระ

- **รอชำระ (Pending)**: ยังไม่ครบกำหนด
- **ชำระแล้ว (Paid)**: ชำระเรียบร้อยแล้ว
- **เกินกำหนด (Overdue)**: เกินกำหนดชำระ
- **ยกเลิก (Cancelled)**: ยกเลิกงวดนี้

## การส่งออกข้อมูล

ระบบสามารถส่งออกข้อมูลสัญญาเป็น CSV รวมถึง:
- เลขที่สัญญา, ชื่อลูกค้า, เบอร์โทร
- ยอดรวม, เงินดาวน์, ยอดผ่อน
- ค่างวด, จำนวนงวด, งวดที่ชำระแล้ว
- ยอดคงเหลือ, สถานะ, วันที่ทำสัญญา

## การพัฒนาต่อ

### ฟีเจอร์ที่ควรเพิ่ม
- [ ] เชื่อมต่อกับฐานข้อมูล Supabase
- [ ] ระบบแจ้งเตือนการครบกำหนด
- [ ] การพิมพ์สัญญาและใบเสร็จ
- [ ] ระบบอนุมัติแบบหลายขั้นตอน
- [ ] การจัดการหลักประกัน
- [ ] รายงานขั้นสูงและกราฟ
- [ ] การซิงค์ข้อมูลหลายสาขา
- [ ] Mobile app สำหรับเจ้าหน้าที่เก็บเงิน

### การเชื่อมต่อฐานข้อมูล
สร้าง tables ใน Supabase:

```sql
-- Installment plans table
CREATE TABLE installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  months INTEGER NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  down_payment_percent DECIMAL(5,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Installment contracts table
CREATE TABLE installment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  sale_id UUID REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  plan_id UUID REFERENCES installment_plans(id),
  
  -- จำนวนเงิน
  total_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL,
  financed_amount DECIMAL(12,2) NOT NULL,
  total_interest DECIMAL(12,2) NOT NULL,
  processing_fee DECIMAL(10,2) NOT NULL,
  total_payable DECIMAL(12,2) NOT NULL,
  monthly_payment DECIMAL(10,2) NOT NULL,
  
  -- วันที่
  contract_date DATE NOT NULL,
  first_payment_date DATE NOT NULL,
  last_payment_date DATE NOT NULL,
  
  -- สถานะ
  status TEXT DEFAULT 'draft',
  
  -- การชำระเงิน
  paid_installments INTEGER DEFAULT 0,
  remaining_installments INTEGER,
  total_paid DECIMAL(12,2) DEFAULT 0,
  remaining_balance DECIMAL(12,2),
  
  -- ข้อมูลเพิ่มเติม
  guarantor_id UUID REFERENCES customers(id),
  collateral TEXT,
  notes TEXT,
  terms TEXT,
  
  -- ข้อมูลระบบ
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP
);

-- Installment payments table
CREATE TABLE installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES installment_contracts(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  principal_amount DECIMAL(10,2) NOT NULL,
  interest_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  payment_method TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## การทดสอบ

### ข้อมูลทดสอบ
- แผนผ่อน: 8 แผน
- ลูกค้าตัวอย่าง: ข้อมูลครบถ้วน
- สัญญาตัวอย่าง: หลากหลายสถานะ

### การทดสอบฟีเจอร์
1. สร้างสัญญาใหม่
2. ตรวจสอบสิทธิ์ลูกค้า
3. คำนวณค่างวดและดอกเบี้ย
4. บันทึกการรับชำระเงิน
5. อัพเดทสถานะสัญญา
6. ส่งออกรายงาน
7. ค้นหาและกรองข้อมูล

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **ไม่สามารถสร้างสัญญาได้**: ตรวจสอบข้อมูลลูกค้าและสิทธิ์
2. **การคำนวณไม่ถูกต้อง**: ตรวจสอบสูตรและพารามิเตอร์
3. **สถานะไม่อัพเดท**: ตรวจสอบการเชื่อมต่อและ state management
4. **ไม่สามารถส่งออกได้**: ตรวจสอบ permissions และข้อมูล

### Performance Tips
- ใช้ React.memo สำหรับ components ที่ซับซ้อน
- Debounce การค้นหา
- Pagination สำหรับรายการสัญญาจำนวนมาก
- Lazy loading สำหรับรายละเอียดสัญญา