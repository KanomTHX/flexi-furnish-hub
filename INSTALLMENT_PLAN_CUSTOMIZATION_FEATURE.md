# ฟีเจอร์ปรับแต่งแผนผ่อนชำระ

## 📋 ภาพรวม

เพิ่มฟีเจอร์ให้ผู้ใช้สามารถปรับแต่งดอกเบี้ยและเงินดาวน์ของแผนผ่อนชำระได้ตามต้องการ โดยไม่ต้องแก้ไขข้อมูลในฐานข้อมูล

## 🎯 ฟีเจอร์ที่เพิ่ม

### 1. การปรับแต่งแผนแบบ Real-time
- **ดอกเบี้ย**: ปรับได้ 0-50% ต่อปี (ทศนิยม 1 ตำแหน่ง)
- **เงินดาวน์**: ปรับได้ 0-100% (จำนวนเต็ม)
- **คำนวณทันที**: ค่างวดและเงินดาวน์อัปเดตทันทีเมื่อเปลี่ยนค่า

### 2. UI/UX ที่ใช้งานง่าย
- **แสดงเมื่อเลือกแผน**: ส่วนปรับแต่งจะแสดงเฉพาะแผนที่เลือก
- **สีสันชัดเจน**: ใช้สีฟ้าเพื่อแยกส่วนปรับแต่งจากข้อมูลหลัก
- **Badge แสดงสถานะ**: แสดง "(แก้ไข)" เมื่อมีการปรับแต่ง
- **ปุ่มรีเซ็ต**: กลับไปใช้ค่าเดิมของแผนได้ทันที

### 3. การจัดการ State
- **Custom Values**: เก็บค่าที่แก้ไขแยกจากข้อมูลแผนเดิม
- **Auto Reset**: รีเซ็ตค่าแก้ไขเมื่อเปลี่ยนแผน
- **Effective Values**: ใช้ค่าที่แก้ไขหรือค่าเดิมตามสถานะ

## 🔧 การทำงาน

### State Management
```typescript
// State สำหรับแก้ไขแผน
const [customInterestRate, setCustomInterestRate] = useState<number | null>(null);
const [customDownPaymentPercent, setCustomDownPaymentPercent] = useState<number | null>(null);

// ฟังก์ชันสำหรับคำนวณค่าที่ใช้จริง
const getEffectiveInterestRate = (plan: InstallmentPlan) => {
  return customInterestRate !== null ? customInterestRate : plan.interestRate;
};

const getEffectiveDownPaymentPercent = (plan: InstallmentPlan) => {
  return customDownPaymentPercent !== null ? customDownPaymentPercent : plan.downPaymentPercent;
};
```

### UI Components
```typescript
{selectedPlan?.id === plan.id && (
  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h4 className="font-medium text-blue-900 mb-3">ปรับแต่งแผน</h4>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>ดอกเบี้ย (% ต่อปี)</Label>
        <Input
          type="number"
          value={customInterestRate !== null ? customInterestRate : plan.interestRate}
          onChange={(e) => setCustomInterestRate(parseFloat(e.target.value) || 0)}
          min="0" max="50" step="0.1"
        />
      </div>
      <div>
        <Label>เงินดาวน์ (%)</Label>
        <Input
          type="number"
          value={customDownPaymentPercent !== null ? customDownPaymentPercent : plan.downPaymentPercent}
          onChange={(e) => setCustomDownPaymentPercent(parseFloat(e.target.value) || 0)}
          min="0" max="100" step="1"
        />
      </div>
    </div>
  </div>
)}
```

### การส่งข้อมูลไปสร้างสัญญา
```typescript
const effectiveInterestRate = getEffectiveInterestRate(selectedPlan);
const effectiveDownPaymentPercent = getEffectiveDownPaymentPercent(selectedPlan);

const contract = await createContract({
  customer: { ...customerData, id: customerId },
  plan: {
    ...selectedPlan,
    interestRate: effectiveInterestRate,
    downPaymentPercent: effectiveDownPaymentPercent
  },
  // ... ข้อมูลอื่นๆ
});
```

## 🎨 การแสดงผล

### แผนที่ไม่ได้เลือก
- แสดงข้อมูลแผนปกติ
- Badge แสดงดอกเบี้ยตามค่าเดิม

### แผนที่เลือก
- แสดงส่วนปรับแต่งสีฟ้า
- Input fields สำหรับดอกเบี้ยและเงินดาวน์
- ปุ่มรีเซ็ตและข้อความแนะนำ
- Badge แสดง "(แก้ไข)" เมื่อมีการปรับแต่ง

### การคำนวณแบบ Real-time
- ค่างวดอัปเดตทันทีเมื่อเปลี่ยนดอกเบี้ย
- เงินดาวน์อัปเดตทันทีเมื่อเปลี่ยนเปอร์เซ็นต์
- คำเตือนรายได้ไม่เพียงพออัปเดตตามค่าใหม่

## 🧪 การทดสอบ

### Test Cases

1. **การปรับดอกเบี้ย**:
   - เปลี่ยนจาก 0% เป็น 5%
   - ตรวจสอบค่างวดเพิ่มขึ้น
   - Badge แสดง "5% ต่อปี (แก้ไข)"

2. **การปรับเงินดาวน์**:
   - เปลี่ยนจาก 20% เป็น 30%
   - ตรวจสอบเงินดาวน์เพิ่มขึ้น
   - ค่างวดลดลง

3. **การรีเซ็ต**:
   - กดปุ่มรีเซ็ต
   - ค่ากลับไปเป็นค่าเดิมของแผน
   - Badge ไม่แสดง "(แก้ไข)"

4. **การเปลี่ยนแผน**:
   - เลือกแผนอื่น
   - ค่าแก้ไขรีเซ็ตอัตโนมัติ
   - ส่วนปรับแต่งย้ายไปแผนใหม่

5. **การสร้างสัญญา**:
   - สร้างสัญญาด้วยค่าที่แก้ไข
   - ตรวจสอบข้อมูลในฐานข้อมูล
   - ค่างวดและเงินดาวน์ถูกต้อง

## 💡 ข้อดี

### สำหรับผู้ใช้
- **ความยืดหยุ่น**: ปรับแผนให้เหมาะกับลูกค้าแต่ละราย
- **ความสะดวก**: ไม่ต้องสร้างแผนใหม่ในฐานข้อมูล
- **การตัดสินใจ**: เห็นผลกระทบทันทีเมื่อเปลี่ยนค่า

### สำหรับระบบ
- **ไม่กระทบฐานข้อมูล**: แผนหลักยังคงเดิม
- **ประสิทธิภาพ**: ไม่ต้อง query ฐานข้อมูลเพิ่ม
- **ความปลอดภัย**: ไม่เสี่ยงทำลายข้อมูลแผนเดิม

## 🔮 การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต
1. **บันทึกแผนที่แก้ไข**: สร้างแผนใหม่จากค่าที่ปรับแต่ง
2. **ประวัติการแก้ไข**: เก็บประวัติการปรับแต่งแต่ละสัญญา
3. **เทมเพลตแผน**: บันทึกการตั้งค่าที่ใช้บ่อย
4. **การอนุมัติ**: ต้องอนุมัติเมื่อแก้ไขเกินขอบเขต
5. **รายงาน**: สถิติการใช้งานการปรับแต่ง

## ✅ สรุป

ฟีเจอร์ปรับแต่งแผนผ่อนชำระเพิ่มความยืดหยุ่นให้กับระบบ โดยไม่กระทบต่อความเสถียรของข้อมูลหลัก ผู้ใช้สามารถปรับแต่งแผนให้เหมาะกับลูกค้าแต่ละรายได้อย่างสะดวกและรวดเร็ว

---
**วันที่สร้าง**: ${new Date().toLocaleDateString('th-TH')}
**ผู้พัฒนา**: Kiro AI Assistant