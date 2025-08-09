// ทดสอบฟีเจอร์เลือกลูกค้าเก่า
const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testExistingCustomerSelection() {
  console.log('🧪 เริ่มทดสอบฟีเจอร์เลือกลูกค้าเก่า...\n');

  try {
    // Test Case 1: ดึงรายการลูกค้าเก่า
    console.log('📝 Test Case 1: ดึงรายการลูกค้าเก่า');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (customersError) {
      console.log('❌ Error:', customersError.message);
    } else {
      console.log('✅ ดึงรายการลูกค้าสำเร็จ');
      console.log('   จำนวนลูกค้า:', customers.length);
      if (customers.length > 0) {
        console.log('   ลูกค้าล่าสุด:', customers[0].name);
        console.log('   เบอร์โทร:', customers[0].phone);
        console.log('   วันที่สร้าง:', new Date(customers[0].created_at).toLocaleDateString('th-TH'));
      }
    }

    // Test Case 2: ค้นหาลูกค้าด้วยชื่อ
    console.log('\n📝 Test Case 2: ค้นหาลูกค้าด้วยชื่อ');
    const searchTerm = 'ทดสอบ';
    const filteredCustomers = customers?.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    console.log('✅ การค้นหาสำเร็จ');
    console.log('   คำค้นหา:', searchTerm);
    console.log('   ผลลัพธ์:', filteredCustomers.length, 'รายการ');

    // Test Case 3: ดึงประวัติสัญญาของลูกค้า
    if (customers && customers.length > 0) {
      const testCustomer = customers[0];
      console.log('\n📝 Test Case 3: ดึงประวัติสัญญาของลูกค้า');
      console.log('   ลูกค้าทดสอบ:', testCustomer.name);

      const { data: contracts, error: contractsError } = await supabase
        .from('installment_contracts')
        .select(`
          *,
          installment_plans (
            name,
            number_of_installments,
            interest_rate
          )
        `)
        .eq('customer_id', testCustomer.id)
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.log('❌ Error:', contractsError.message);
      } else {
        console.log('✅ ดึงประวัติสัญญาสำเร็จ');
        console.log('   จำนวนสัญญา:', contracts.length);
        if (contracts.length > 0) {
          console.log('   สัญญาล่าสุด:');
          console.log('     ยอดเงิน: ฿' + contracts[0].total_amount?.toLocaleString());
          console.log('     แผน:', contracts[0].installment_plans?.name);
          console.log('     สถานะ:', contracts[0].status);
          console.log('     วันที่:', new Date(contracts[0].created_at).toLocaleDateString('th-TH'));
        }
      }

      // Test Case 4: ดึงผู้ค้ำประกันเก่า
      console.log('\n📝 Test Case 4: ดึงผู้ค้ำประกันเก่า');
      const { data: guarantors, error: guarantorsError } = await supabase
        .from('guarantors')
        .select('*')
        .eq('customer_id', testCustomer.id)
        .order('created_at', { ascending: false });

      if (guarantorsError) {
        console.log('❌ Error:', guarantorsError.message);
      } else {
        console.log('✅ ดึงข้อมูลผู้ค้ำประกันสำเร็จ');
        console.log('   จำนวนผู้ค้ำประกัน:', guarantors.length);
        if (guarantors.length > 0) {
          console.log('   ผู้ค้ำประกันล่าสุด:');
          console.log('     ชื่อ:', guarantors[0].name);
          console.log('     เบอร์โทร:', guarantors[0].phone);
          console.log('     อาชีพ:', guarantors[0].occupation);
          console.log('     รายได้: ฿' + guarantors[0].monthly_income?.toLocaleString());
        }
      }
    }

    // Test Case 5: สร้างข้อมูลทดสอบ (ถ้าไม่มีลูกค้า)
    if (!customers || customers.length === 0) {
      console.log('\n📝 Test Case 5: สร้างข้อมูลลูกค้าทดสอบ');
      
      const testCustomerData = {
        name: 'ลูกค้าทดสอบ ' + Date.now(),
        phone: '081-234-5678',
        email: 'test@example.com',
        id_card: '1234567890123',
        occupation: 'พนักงานบริษัท',
        monthly_income: 30000,
        address: 'ที่อยู่ทดสอบ',
        province: 'กรุงเทพมหานคร',
        district: 'บางรัก',
        subdistrict: 'สีลม',
        zip_code: '10500',
        created_at: new Date().toISOString()
      };

      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([testCustomerData])
        .select()
        .single();

      if (createError) {
        console.log('❌ Error:', createError.message);
      } else {
        console.log('✅ สร้างลูกค้าทดสอบสำเร็จ');
        console.log('   ID:', newCustomer.id);
        console.log('   ชื่อ:', newCustomer.name);
        console.log('   เบอร์โทร:', newCustomer.phone);

        // สร้างสัญญาทดสอบ
        const testContractData = {
          customer_id: newCustomer.id,
          total_amount: 50000,
          down_payment: 10000,
          loan_amount: 40000,
          monthly_payment: 4000,
          number_of_installments: 12,
          interest_rate: 5.0,
          status: 'active',
          created_at: new Date().toISOString()
        };

        const { data: newContract, error: contractError } = await supabase
          .from('installment_contracts')
          .insert([testContractData])
          .select()
          .single();

        if (contractError) {
          console.log('❌ Error creating contract:', contractError.message);
        } else {
          console.log('✅ สร้างสัญญาทดสอบสำเร็จ');
          console.log('   ยอดเงิน: ฿' + newContract.total_amount.toLocaleString());
        }

        // สร้างผู้ค้ำประกันทดสอบ
        const testGuarantorData = {
          customer_id: newCustomer.id,
          name: 'ผู้ค้ำประกันทดสอบ',
          phone: '082-345-6789',
          id_card: '9876543210987',
          occupation: 'ข้าราชการ',
          monthly_income: 40000,
          address: 'ที่อยู่ผู้ค้ำประกัน',
          relationship: 'เพื่อน',
          created_at: new Date().toISOString()
        };

        const { data: newGuarantor, error: guarantorError } = await supabase
          .from('guarantors')
          .insert([testGuarantorData])
          .select()
          .single();

        if (guarantorError) {
          console.log('❌ Error creating guarantor:', guarantorError.message);
        } else {
          console.log('✅ สร้างผู้ค้ำประกันทดสอบสำเร็จ');
          console.log('   ชื่อ:', newGuarantor.name);
        }
      }
    }

    // Test Case 6: ทดสอบการกรองข้อมูล
    console.log('\n📝 Test Case 6: ทดสอบการกรองข้อมูล');
    
    // กรองลูกค้าที่มีรายได้มากกว่า 25,000
    const highIncomeCustomers = customers?.filter(customer => 
      customer.monthly_income && customer.monthly_income > 25000
    ) || [];

    console.log('✅ การกรองสำเร็จ');
    console.log('   ลูกค้ารายได้สูง (>25,000):', highIncomeCustomers.length, 'คน');

    // กรองลูกค้าที่สร้างในเดือนนี้
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const recentCustomers = customers?.filter(customer => 
      new Date(customer.created_at) >= thisMonth
    ) || [];

    console.log('   ลูกค้าใหม่เดือนนี้:', recentCustomers.length, 'คน');

    console.log('\n🎉 การทดสอบเสร็จสิ้น!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
  }
}

// ฟังก์ชันทดสอบ Performance
async function testPerformance() {
  console.log('\n⚡ ทดสอบประสิทธิภาพ...');
  
  try {
    const startTime = Date.now();
    
    // ทดสอบการดึงข้อมูลลูกค้าจำนวนมาก
    const { data: manyCustomers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ ทดสอบประสิทธิภาพสำเร็จ');
      console.log('   จำนวนข้อมูล:', manyCustomers.length, 'รายการ');
      console.log('   เวลาที่ใช้:', duration, 'ms');
      console.log('   ประสิทธิภาพ:', duration < 1000 ? 'ดี' : 'ต้องปรับปรุง');
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบประสิทธิภาพ:', error.message);
  }
}

// ฟังก์ชันทำความสะอาดข้อมูลทดสอบ
async function cleanupTestData() {
  console.log('\n🧹 ทำความสะอาดข้อมูลทดสอบ...');
  
  try {
    // ลบลูกค้าทดสอบ
    const { data: testCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, name')
      .like('name', '%ทดสอบ%');

    if (fetchError) {
      console.log('❌ Error:', fetchError.message);
      return;
    }

    if (testCustomers.length === 0) {
      console.log('✅ ไม่มีข้อมูลทดสอบที่ต้องลบ');
      return;
    }

    console.log(`📋 พบข้อมูลทดสอบ ${testCustomers.length} รายการ:`);
    testCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} (ID: ${customer.id})`);
    });

    console.log('\n⚠️  หากต้องการลบข้อมูลทดสอบ ให้รันคำสั่ง:');
    console.log('   DELETE FROM customers WHERE name LIKE \'%ทดสอบ%\';');
    console.log('   DELETE FROM installment_contracts WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE \'%ทดสอบ%\');');
    console.log('   DELETE FROM guarantors WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE \'%ทดสอบ%\');');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทำความสะอาด:', error.message);
  }
}

// รันการทดสอบ
if (require.main === module) {
  console.log('🚀 เริ่มต้นการทดสอบฟีเจอร์เลือกลูกค้าเก่า\n');
  console.log('⚠️  กรุณาตั้งค่า Supabase URL และ Key ก่อนรันการทดสอบ\n');
  
  // แสดงวิธีการใช้งาน
  console.log('📖 วิธีการใช้งาน:');
  console.log('1. แก้ไข supabaseUrl และ supabaseKey ในไฟล์นี้');
  console.log('2. รันคำสั่ง: node test_existing_customer_selection.js');
  console.log('3. ตรวจสอบผลการทดสอบ\n');
  
  // testExistingCustomerSelection();
  // testPerformance();
  // cleanupTestData();
}

module.exports = {
  testExistingCustomerSelection,
  testPerformance,
  cleanupTestData
};