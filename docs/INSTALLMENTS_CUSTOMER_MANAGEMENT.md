# Installments Customer Management System

## Overview
ระบบจัดการลูกค้าในโมดูล Installments เป็นระบบที่ครอบคลุมสำหรับจัดการข้อมูลลูกค้าผ่อนชำระ ประเมินความเสี่ยง และติดตามประวัติการชำระเงิน

## ✅ Features ที่พัฒนาเสร็จแล้ว

### 1. Customer Management ✅
- **CRUD Operations**: เพิ่ม แก้ไข ดู ลบข้อมูลลูกค้า
- **Customer Profile**: ข้อมูลส่วนตัว ที่อยู่ อาชีพ รายได้
- **Search & Filter**: ค้นหาและกรองลูกค้าตามเกณฑ์ต่างๆ
- **Customer Statistics**: สถิติลูกค้าแบบ real-time

### 2. Credit Scoring System ✅
- **Automatic Calculation**: คำนวณคะแนนเครดิตอัตโนมัติ
- **Multiple Factors**: รายได้ อาชีพ ประวัติการชำระ
- **Risk Assessment**: ประเมินความเสี่ยง (ต่ำ/ปานกลาง/สูง)
- **Score Range**: 300-850 คะแนน

### 3. Customer Detail View ✅
- **Complete Profile**: ข้อมูลลูกค้าครบถ้วน
- **Contract History**: ประวัติสัญญาทั้งหมด
- **Payment History**: ประวัติการชำระเงิน
- **Financial Summary**: สรุปข้อมูลทางการเงิน

### 4. Risk Management ✅
- **Risk Levels**: 3 ระดับความเสี่ยง
- **Overdue Tracking**: ติดตามลูกค้าค้างชำระ
- **Risk Indicators**: ตัวชี้วัดความเสี่ยงต่างๆ
- **Alert System**: การแจ้งเตือนลูกค้าเสี่ยงสูง

### 5. Customer Analytics ✅
- **Credit Score Distribution**: การกระจายคะแนนเครดิต
- **Risk Distribution**: การกระจายความเสี่ยง
- **Monthly Trends**: แนวโน้มลูกค้าใหม่รายเดือน
- **Occupation Analysis**: การวิเคราะห์ตามอาชีพ
- **Top Customers**: ลูกค้าอันดับต้น
- **High Risk Alerts**: การแจ้งเตือนลูกค้าเสี่ยงสูง

### 6. Integration with Contracts ✅
- **Auto Update**: อัปเดตข้อมูลลูกค้าจากสัญญาอัตโนมัติ
- **Contract Linking**: เชื่อมโยงลูกค้ากับสัญญา
- **Payment Sync**: ซิงค์ข้อมูลการชำระเงิน
- **Status Tracking**: ติดตามสถานะลูกค้า

## 🎯 Technical Implementation

### File Structure
```
src/
├── components/installments/
│   ├── CustomerManagement.tsx     ✅ หน้าจัดการลูกค้า
│   ├── CustomerDetail.tsx         ✅ รายละเอียดลูกค้า
│   └── CustomerAnalytics.tsx      ✅ การวิเคราะห์ลูกค้า
├── hooks/
│   └── useCustomers.ts            ✅ Custom hook
└── pages/
    └── Installments.tsx           ✅ อัปเดตแล้ว
```

### Key Components

#### 1. CustomerManagement Component
- **Customer List**: ตารางแสดงรายชื่อลูกค้า
- **Add/Edit Forms**: ฟอร์มเพิ่ม/แก้ไขลูกค้า
- **Search & Filter**: ค้นหาและกรองข้อมูล
- **Statistics Cards**: การ์ดแสดงสถิติ

#### 2. CustomerDetail Component
- **Profile Section**: ข้อมูลส่วนตัวลูกค้า
- **Credit Score**: คะแนนเครดิตและความเสี่ยง
- **Financial Summary**: สรุปข้อมูลทางการเงิน
- **Contract History**: ประวัติสัญญาทั้งหมด
- **Payment History**: ประวัติการชำระเงิน

#### 3. CustomerAnalytics Component
- **Key Metrics**: สถิติหลัก 4 ตัวชี้วัด
- **Credit Distribution**: การกระจายคะแนนเครดิต
- **Risk Analysis**: การวิเคราะห์ความเสี่ยง
- **Monthly Trends**: แนวโน้มลูกค้าใหม่
- **Top Customers**: ลูกค้าอันดับต้น
- **Risk Alerts**: การแจ้งเตือนลูกค้าเสี่ยงสูง

#### 4. useCustomers Hook
- **State Management**: จัดการ state ลูกค้า
- **CRUD Operations**: ฟังก์ชัน CRUD
- **Credit Calculation**: คำนวณคะแนนเครดิต
- **Risk Assessment**: ประเมินความเสี่ยง

## 📊 Data Structure

### CustomerData Interface
```typescript
interface CustomerData extends Customer {
  creditScore: number;           // 300-850
  totalContracts: number;        // จำนวนสัญญาทั้งหมด
  activeContracts: number;       // สัญญาที่ใช้งานอยู่
  totalFinanced: number;         // ยอดให้เครดิตรวม
  totalPaid: number;            // ยอดที่ชำระแล้ว
  overdueAmount: number;        // ยอดค้างชำระ
  lastPaymentDate: Date;        // วันที่ชำระล่าสุด
  riskLevel: 'low'|'medium'|'high'; // ระดับความเสี่ยง
  customerSince: Date;          // วันที่เป็นลูกค้า
  notes: string;                // หมายเหตุ
}
```

## 🎨 UI/UX Features

### Customer Management Page
- **Statistics Dashboard**: 4 การ์ดสถิติหลัก
- **Advanced Filters**: กรองตามความเสี่ยง สถานะ
- **Responsive Table**: ตารางแสดงข้อมูลแบบ responsive
- **Action Buttons**: ปุ่มดู แก้ไข สำหรับแต่ละลูกค้า

### Customer Detail Modal
- **3-Column Layout**: จัดเรียงข้อมูลแบบ 3 คอลัมน์
- **Credit Score Visualization**: แสดงคะแนนเครดิตแบบกราฟิก
- **Color-Coded Risk**: ใช้สีแยกระดับความเสี่ยง
- **Scrollable History**: ประวัติการชำระแบบเลื่อนได้

### Form Validation
- **Required Fields**: ตรวจสอบฟิลด์จำเป็น
- **Data Format**: ตรวจสอบรูปแบบข้อมูล
- **Error Messages**: แสดงข้อผิดพลาดแบบ real-time

## 🔧 Credit Scoring Algorithm

### Base Score: 500 คะแนน

### Income Factor
- รายได้ ≥ 50,000: +150 คะแนน
- รายได้ ≥ 30,000: +100 คะแนน  
- รายได้ ≥ 20,000: +50 คะแนน

### Occupation Factor
- อาชีพเสถียร (ข้าราชการ, พนักงานบริษัท): +50 คะแนน
- อาชีพเสี่ยง (ค้าขาย, อิสระ): ไม่เพิ่ม

### Payment History Factor
- ชำระตรงเวลา ≥ 95%: +100 คะแนน
- ชำระตรงเวลา ≥ 85%: +50 คะแนน
- ชำระตรงเวลา < 70%: -100 คะแนน

### Overdue Factor
- ค้างชำระ > 30% ของยอดรวม: -150 คะแนน
- ค้างชำระ > 10% ของยอดรวม: -75 คะแนน

## 📈 Mock Data

### 5 ลูกค้าตัวอย่าง:
1. **สมชาย ใจดี** - คะแนน 720 (ความเสี่ยงต่ำ)
2. **สมหญิง รักงาน** - คะแนน 780 (ความเสี่ยงต่ำ)
3. **วิชัย ขยัน** - คะแนน 650 (ความเสี่ยงปานกลาง)
4. **มาลี ขยัน** - คะแนน 680 (ความเสี่ยงต่ำ)
5. **สุชาติ ลำบาก** - คะแนน 580 (ความเสี่ยงสูง)

## 🚀 การใช้งาน

### 1. เข้าสู่ระบบ
- ไปที่ `http://localhost:8081/installments`
- เลือกแท็บที่ต้องการ

### 2. จัดการลูกค้า (แท็บ "ลูกค้า")
- **เพิ่มลูกค้าใหม่**: คลิก "เพิ่มลูกค้าใหม่"
- **ค้นหาลูกค้า**: ใช้ช่องค้นหา
- **กรองข้อมูล**: เลือกความเสี่ยงหรือสถานะ
- **ดูรายละเอียด**: คลิกปุ่ม "ดู"
- **แก้ไขข้อมูล**: คลิกปุ่ม "แก้ไข"

### 3. ดูรายละเอียดลูกค้า
- **ข้อมูลส่วนตัว**: ด้านซ้าย
- **คะแนนเครดิต**: ด้านซ้ายล่าง
- **สรุปการเงิน**: ด้านขวาบน
- **ประวัติสัญญา**: ด้านขวากลาง
- **ประวัติการชำระ**: ด้านขวาล่าง

### 4. การวิเคราะห์ลูกค้า (แท็บ "การวิเคราะห์")
- **สถิติหลัก**: ลูกค้าทั้งหมด คะแนนเฉลี่ย อัตราชำระ
- **การกระจายคะแนน**: ดูการกระจายคะแนนเครดิต
- **การวิเคราะห์ความเสี่ยง**: ดูสัดส่วนความเสี่ยง
- **แนวโน้มรายเดือน**: ลูกค้าใหม่ในแต่ละเดือน
- **ลูกค้าอันดับต้น**: ตามยอดให้เครดิต
- **ลูกค้าเสี่ยงสูง**: ที่ต้องติดตาม

## ✅ สรุปความสำเร็จ

### 🎯 ฟีเจอร์ที่สมบูรณ์:
- ✅ **Customer Management**: CRUD operations ครบถ้วน
- ✅ **Credit Scoring**: ระบบคำนวณคะแนนอัตโนมัติ
- ✅ **Risk Assessment**: ประเมินความเสี่ยง 3 ระดับ
- ✅ **Customer Detail**: รายละเอียดลูกค้าครบถ้วน
- ✅ **Customer Analytics**: การวิเคราะห์ข้อมูลลูกค้า
- ✅ **Search & Filter**: ค้นหาและกรองข้อมูล
- ✅ **Integration**: เชื่อมโยงกับระบบสัญญา
- ✅ **Responsive UI**: ใช้งานได้ทุกอุปกรณ์
- ✅ **Form Validation**: ตรวจสอบข้อมูลครบถ้วน
- ✅ **Data Visualization**: กราฟและชาร์ตแสดงข้อมูล

### 📊 สถิติระบบ:
- **5 ลูกค้าตัวอย่าง** พร้อมข้อมูลสมจริง
- **Credit Score Range**: 580-780 คะแนน
- **Risk Distribution**: 3 ต่ำ, 1 ปานกลาง, 1 สูง
- **Mock Contracts**: เชื่อมโยงกับระบบสัญญา

**ระบบจัดการลูกค้าในโมดูล Installments พร้อมใช้งานเต็มรูปแบบแล้ว! 🎉**