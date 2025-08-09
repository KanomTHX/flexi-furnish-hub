# ฟีเจอร์เลือกลูกค้าเก่า

## 📋 ภาพรวม

เพิ่มฟีเจอร์ให้ผู้ใช้สามารถเลือกลูกค้าเก่าที่มีในฐานข้อมูลแล้ว พร้อมดึงประวัติการทำสัญญาและข้อมูลผู้ค้ำประกันเก่ามาแสดง เพื่อรองรับลูกค้าเก่าที่ต้องการสร้างสัญญาผ่อนชำระใหม่

## 🎯 ฟีเจอร์ที่เพิ่ม

### 1. **ปุ่มเลือกลูกค้าเก่า**
- **ตำแหน่ง**: อยู่ในหัว Card "ข้อมูลลูกค้า" ของขั้นตอนแรก
- **การแสดงผล**: ปุ่มสีฟ้าพร้อมไอคอน User
- **การทำงาน**: เปิด Dialog แสดงรายการลูกค้าเก่า

### 2. **Dialog เลือกลูกค้าเก่า**
- **ขนาด**: ใหญ่ (max-w-6xl) เพื่อแสดงข้อมูลครบถ้วน
- **ช่องค้นหา**: ค้นหาด้วยชื่อ, เบอร์โทร, หรืออีเมล
- **รายการลูกค้า**: แสดงข้อมูลสำคัญในรูปแบบ Card

### 3. **การแสดงข้อมูลลูกค้า**
- **ข้อมูลหลัก**: ชื่อ, เบอร์โทร, อีเมล, อาชีพ
- **ข้อมูลเพิ่มเติม**: รายได้, ที่อยู่, วันที่สร้าง
- **ID Badge**: แสดง 8 หลักท้ายของ ID
- **การเลือก**: คลิกที่ Card หรือปุ่ม "เลือก"

### 4. **ประวัติการทำสัญญา**
- **แสดงเมื่อเลือกลูกค้า**: ประวัติจะแสดงด้านล่าง
- **ข้อมูลสัญญา**: ยอดเงิน, แผนผ่อน, สถานะ, วันที่
- **การจัดเรียง**: เรียงตามวันที่ล่าสุดก่อน
- **สถานะ Badge**: แสดงสถานะด้วยสีที่เหมาะสม

### 5. **ข้อมูลผู้ค้ำประกันเก่า**
- **แสดงถ้ามี**: ผู้ค้ำประกันที่เคยใช้
- **ข้อมูลสำคัญ**: ชื่อ, เบอร์โทร, อาชีพ, รายได้
- **การเลือกอัตโนมัติ**: เลือกผู้ค้ำประกันล่าสุดอัตโนมัติ

## 🔧 การทำงาน

### State Management
```typescript
// State สำหรับเลือกลูกค้าเก่า
const [showExistingCustomer, setShowExistingCustomer] = useState(false);
const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);
const [customerHistory, setCustomerHistory] = useState<any[]>([]);
const [existingGuarantors, setExistingGuarantors] = useState<any[]>([]);
```

### การดึงข้อมูลลูกค้า
```typescript
const fetchExistingCustomers = async () => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setExistingCustomers(customers || []);
  } catch (error) {
    console.error('Error fetching existing customers:', error);
  }
};
```

### การดึงประวัติสัญญา
```typescript
const fetchCustomerHistory = async (customerId: string) => {
  try {
    const { data: contracts, error } = await supabase
      .from('installment_contracts')
      .select(`
        *,
        installment_plans (
          name,
          number_of_installments,
          interest_rate
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setCustomerHistory(contracts || []);
  } catch (error) {
    console.error('Error fetching customer history:', error);
  }
};
```

### การดึงผู้ค้ำประกันเก่า
```typescript
const fetchExistingGuarantors = async (customerId: string) => {
  try {
    const { data: guarantors, error } = await supabase
      .from('guarantors')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setExistingGuarantors(guarantors || []);
    return guarantors || [];
  } catch (error) {
    console.error('Error fetching existing guarantors:', error);
    return [];
  }
};
```

### การเลือกลูกค้า
```typescript
const handleSelectExistingCustomer = async (customer: Customer) => {
  setSelectedExistingCustomer(customer);
  
  // ดึงประวัติและผู้ค้ำประกัน
  await fetchCustomerHistory(customer.id);
  const guarantors = await fetchExistingGuarantors(customer.id);
  
  // ถ้ามีผู้ค้ำประกันเก่า ให้เลือกคนล่าสุด
  if (guarantors && guarantors.length > 0) {
    setGuarantor(guarantors[0]);
  }
};
```

## 🎨 การแสดงผล

### ปุ่มเลือกลูกค้าเก่า
```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowExistingCustomer(true)}
  className="text-blue-600 border-blue-200 hover:bg-blue-50"
>
  <User className="h-4 w-4 mr-2" />
  เลือกลูกค้าเก่า
</Button>
```

### ช่องค้นหา
```typescript
<Input
  placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรืออีเมล..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

### Card ลูกค้า
```typescript
<Card 
  className={`cursor-pointer hover:bg-blue-50 border-2 transition-colors ${
    selectedExistingCustomer?.id === customer.id 
      ? 'border-blue-500 bg-blue-50' 
      : 'hover:border-blue-200'
  }`}
  onClick={() => handleSelectExistingCustomer(customer)}
>
  <CardContent className="p-4">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-medium text-lg">{customer.name}</h3>
          <Badge variant="outline" className="text-xs">
            ID: {customer.id?.slice(-8)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <p><strong>เบอร์โทร:</strong> {customer.phone}</p>
            <p><strong>อีเมล:</strong> {customer.email || 'ไม่ระบุ'}</p>
            <p><strong>อาชีพ:</strong> {customer.occupation || 'ไม่ระบุ'}</p>
          </div>
          <div>
            <p><strong>รายได้:</strong> ฿{customer.monthlyIncome?.toLocaleString() || 'ไม่ระบุ'}</p>
            <p><strong>ที่อยู่:</strong> {customer.address || 'ไม่ระบุ'}</p>
            <p><strong>วันที่สร้าง:</strong> {new Date(customer.created_at || '').toLocaleDateString('th-TH')}</p>
          </div>
        </div>
      </div>
      
      <Button size="sm" className="ml-4">
        เลือก
      </Button>
    </div>
  </CardContent>
</Card>
```

### ประวัติสัญญา
```typescript
<div className="space-y-2 max-h-40 overflow-y-auto">
  {customerHistory.map((contract, index) => (
    <div key={contract.id} className="bg-gray-50 p-3 rounded-lg text-sm">
      <div className="flex justify-between items-start">
        <div>
          <p><strong>สัญญาที่ {index + 1}:</strong> ฿{contract.total_amount?.toLocaleString()}</p>
          <p><strong>แผน:</strong> {contract.installment_plans?.name} ({contract.installment_plans?.number_of_installments} งวด)</p>
          <p><strong>สถานะ:</strong> 
            <Badge 
              variant={contract.status === 'active' ? 'default' : 'secondary'}
              className="ml-1"
            >
              {contract.status}
            </Badge>
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {new Date(contract.created_at).toLocaleDateString('th-TH')}
        </div>
      </div>
    </div>
  ))}
</div>
```

## 🧪 การทดสอบ

### Test Cases

1. **การเปิด Dialog เลือกลูกค้า**:
   - กดปุ่ม "เลือกลูกค้าเก่า"
   - ตรวจสอบ Dialog เปิดขึ้น
   - ตรวจสอบรายการลูกค้าแสดงถูกต้อง

2. **การค้นหาลูกค้า**:
   - พิมพ์ชื่อลูกค้าในช่องค้นหา
   - ตรวจสอบผลการกรองถูกต้อง
   - ลองค้นหาด้วยเบอร์โทรและอีเมล

3. **การเลือกลูกค้า**:
   - คลิกที่ Card ลูกค้า
   - ตรวจสอบ Card ถูกเลือก (สีเปลี่ยน)
   - ตรวจสอบประวัติแสดงด้านล่าง

4. **การแสดงประวัติ**:
   - เลือกลูกค้าที่มีประวัติ
   - ตรวจสอบข้อมูลสัญญาแสดงถูกต้อง
   - ตรวจสอบผู้ค้ำประกันแสดงถูกต้อง

5. **การยืนยันการเลือก**:
   - กดปุ่ม "ใช้ข้อมูลลูกค้านี้"
   - ตรวจสอบข้อมูลถูกนำมาใส่ในฟอร์ม
   - ตรวจสอบ Dialog ปิด

6. **การยกเลิก**:
   - กดปุ่ม "ยกเลิก"
   - ตรวจสอบ Dialog ปิด
   - ตรวจสอบข้อมูลไม่เปลี่ยนแปลง

## 💡 ข้อดี

### สำหรับผู้ใช้
- **ประหยัดเวลา**: ไม่ต้องกรอกข้อมูลซ้ำ
- **ความแม่นยำ**: ใช้ข้อมูลที่มีอยู่แล้ว ลดข้อผิดพลาด
- **ข้อมูลประวัติ**: เห็นประวัติการทำสัญญาก่อนหน้า
- **ผู้ค้ำประกันเก่า**: สามารถใช้ผู้ค้ำประกันเดิมได้

### สำหรับธุรกิจ
- **ลูกค้าเก่า**: ส่งเสริมให้ลูกค้าเก่ากลับมาใช้บริการ
- **ความสัมพันธ์**: รักษาความสัมพันธ์กับลูกค้าเก่า
- **ข้อมูลครบถ้วน**: มีข้อมูลประวัติสำหรับการตัดสินใจ
- **ประสิทธิภาพ**: ลดเวลาในการกรอกข้อมูล

## 🔮 การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต
1. **การกรองขั้นสูง**: กรองตามสถานะ, วันที่, ยอดเงิน
2. **การเรียงลำดับ**: เรียงตามชื่อ, วันที่, ยอดเงิน
3. **ข้อมูลเพิ่มเติม**: คะแนนเครดิต, ประวัติการชำระ
4. **การแจ้งเตือน**: แจ้งเตือนลูกค้าที่ควรติดตาม
5. **การส่งออกข้อมูล**: ส่งออกรายการลูกค้าเป็น Excel
6. **การซิงค์**: ซิงค์ข้อมูลจากระบบอื่น

## 🚀 วิธีการใช้งาน

### ขั้นตอนการเลือกลูกค้าเก่า
1. **เปิดหน้าสร้างสัญญา** → ขั้นตอน "ข้อมูลลูกค้า"
2. **กดปุ่ม "เลือกลูกค้าเก่า"** → Dialog จะเปิดขึ้น
3. **ค้นหาลูกค้า** → พิมพ์ชื่อ, เบอร์โทร, หรืออีเมล
4. **เลือกลูกค้า** → คลิกที่ Card ลูกค้าที่ต้องการ
5. **ดูประวัติ** → ตรวจสอบประวัติการทำสัญญา
6. **ยืนยันการเลือก** → กดปุ่ม "ใช้ข้อมูลลูกค้านี้"
7. **ดำเนินการต่อ** → ข้อมูลจะถูกนำมาใส่ในฟอร์ม

### ตัวอย่างการใช้งาน
- **ลูกค้าเก่าต้องการผ่อนใหม่**: เลือกลูกค้าเก่าและดูประวัติ
- **ลูกค้าที่เคยมีปัญหา**: ตรวจสอบประวัติก่อนอนุมัติ
- **ใช้ผู้ค้ำประกันเดิม**: เลือกลูกค้าที่มีผู้ค้ำประกันแล้ว

## ⚠️ ข้อควรระวัง

### การตรวจสอบข้อมูล
- **ข้อมูลล่าสุด**: ตรวจสอบว่าข้อมูลยังเป็นปัจจุบัน
- **การเปลี่ยนแปลง**: อัปเดตข้อมูลที่เปลี่ยนแปลง
- **ประวัติการชำระ**: ตรวจสอบประวัติการชำระเงิน

### ความปลอดภัย
- **สิทธิ์การเข้าถึง**: ตรวจสอบสิทธิ์ในการดูข้อมูลลูกค้า
- **ข้อมูลส่วนตัว**: ปกป้องข้อมูลส่วนตัวของลูกค้า
- **การบันทึกล็อก**: บันทึกการเข้าถึงข้อมูลลูกค้า

## ✅ สรุป

ฟีเจอร์เลือกลูกค้าเก่าช่วยเพิ่มประสิทธิภาพในการสร้างสัญญาผ่อนชำระสำหรับลูกค้าเก่า โดยสามารถดึงข้อมูลและประวัติที่มีอยู่แล้วมาใช้ได้ทันที ลดเวลาในการกรอกข้อมูลและเพิ่มความแม่นยำ

### ความสำเร็จหลัก
1. **ระบบค้นหาที่รวดเร็ว**
2. **การแสดงข้อมูลที่ครบถ้วน**
3. **ประวัติการทำสัญญาที่ชัดเจน**
4. **การเลือกผู้ค้ำประกันเก่าอัตโนมัติ**
5. **UI/UX ที่ใช้งานง่าย**

---

**วันที่สร้าง**: 8 สิงหาคม 2025  
**ผู้พัฒนา**: Kiro AI Assistant  
**สถานะ**: เสร็จสิ้นและพร้อมใช้งาน ✅