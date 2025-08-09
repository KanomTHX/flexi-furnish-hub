// ทดสอบการสร้างแผนผ่อนชำระกำหนดเอง
const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomPlanCreation() {
  console.log('🧪 เริ่มทดสอบการสร้างแผนกำหนดเอง...\n');

  try {
    // Test Case 1: สร้างแผนพื้นฐาน
    console.log('📝 Test Case 1: สร้างแผนพื้นฐาน');
    const basicPlan = {
      plan_number: `CUSTOM-${Date.now()}-BASIC`,
      name: 'แผนทดสอบ 12 งวด',
      description: 'แผนทดสอบสำหรับการพัฒนา',
      number_of_installments: 12,
      interest_rate: 5.0,
      down_payment_percent: 20,
      processing_fee: 500,
      total_amount: 1000000,
      installment_amount: 0,
      is_active: true,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      branch_id: null
    };

    const { data: basicResult, error: basicError } = await supabase
      .from('installment_plans')
      .insert([basicPlan])
      .select()
      .single();

    if (basicError) {
      console.log('❌ Error:', basicError.message);
    } else {
      console.log('✅ สร้างแผนพื้นฐานสำเร็จ');
      console.log('   ID:', basicResult.id);
      console.log('   ชื่อ:', basicResult.name);
      console.log('   งวด:', basicResult.number_of_installments);
      console.log('   ดอกเบี้ย:', basicResult.interest_rate + '%');
    }

    // Test Case 2: สร้างแผนไม่มีดอกเบี้ย
    console.log('\n📝 Test Case 2: สร้างแผนไม่มีดอกเบี้ย');
    const noInterestPlan = {
      plan_number: `CUSTOM-${Date.now()}-ZERO`,
      name: 'แผนไม่มีดอกเบี้ย 6 งวด',
      description: 'แผนโปรโมชั่นพิเศษ',
      number_of_installments: 6,
      interest_rate: 0,
      down_payment_percent: 30,
      processing_fee: 0,
      total_amount: 1000000,
      installment_amount: 0,
      is_active: true,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      branch_id: null
    };

    const { data: zeroResult, error: zeroError } = await supabase
      .from('installment_plans')
      .insert([noInterestPlan])
      .select()
      .single();

    if (zeroError) {
      console.log('❌ Error:', zeroError.message);
    } else {
      console.log('✅ สร้างแผนไม่มีดอกเบี้ยสำเร็จ');
      console.log('   ID:', zeroResult.id);
      console.log('   ชื่อ:', zeroResult.name);
      console.log('   งวด:', zeroResult.number_of_installments);
      console.log('   ดอกเบี้ย:', zeroResult.interest_rate + '%');
    }

    // Test Case 3: สร้างแผนระยะยาว
    console.log('\n📝 Test Case 3: สร้างแผนระยะยาว');
    const longTermPlan = {
      plan_number: `CUSTOM-${Date.now()}-LONG`,
      name: 'แผนระยะยาว 36 งวด',
      description: 'แผนสำหรับสินค้าราคาสูง',
      number_of_installments: 36,
      interest_rate: 8.5,
      down_payment_percent: 15,
      processing_fee: 1000,
      total_amount: 1000000,
      installment_amount: 0,
      is_active: true,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      branch_id: null
    };

    const { data: longResult, error: longError } = await supabase
      .from('installment_plans')
      .insert([longTermPlan])
      .select()
      .single();

    if (longError) {
      console.log('❌ Error:', longError.message);
    } else {
      console.log('✅ สร้างแผนระยะยาวสำเร็จ');
      console.log('   ID:', longResult.id);
      console.log('   ชื่อ:', longResult.name);
      console.log('   งวด:', longResult.number_of_installments);
      console.log('   ดอกเบี้ย:', longResult.interest_rate + '%');
    }

    // Test Case 4: ทดสอบการดึงแผนที่สร้างใหม่
    console.log('\n📝 Test Case 4: ทดสอบการดึงแผนที่สร้างใหม่');
    const { data: allPlans, error: fetchError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.log('❌ Error:', fetchError.message);
    } else {
      console.log('✅ ดึงข้อมูลแผนสำเร็จ');
      console.log('   จำนวนแผนทั้งหมด:', allPlans.length);
      console.log('   แผนล่าสุด 3 อันดับ:');
      allPlans.slice(0, 3).forEach((plan, index) => {
        console.log(`   ${index + 1}. ${plan.name} (${plan.number_of_installments} งวด, ${plan.interest_rate}%)`);
      });
    }

    // Test Case 5: ทดสอบการคำนวณ
    console.log('\n📝 Test Case 5: ทดสอบการคำนวณ');
    const testAmount = 50000;
    const testPlan = basicResult || { 
      interest_rate: 5, 
      number_of_installments: 12, 
      down_payment_percent: 20 
    };

    // คำนวณเงินดาวน์
    const downPayment = Math.round(testAmount * (testPlan.down_payment_percent / 100));
    
    // คำนวณยอดผ่อน
    const loanAmount = testAmount - downPayment;
    
    // คำนวณค่างวด (สูตรง่าย)
    const monthlyInterestRate = testPlan.interest_rate / 100 / 12;
    const monthlyPayment = monthlyInterestRate > 0 
      ? Math.round(loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, testPlan.number_of_installments)) / (Math.pow(1 + monthlyInterestRate, testPlan.number_of_installments) - 1))
      : Math.round(loanAmount / testPlan.number_of_installments);

    console.log('✅ การคำนวณสำเร็จ');
    console.log('   ยอดสินค้า: ฿' + testAmount.toLocaleString());
    console.log('   เงินดาวน์: ฿' + downPayment.toLocaleString());
    console.log('   ยอดผ่อน: ฿' + loanAmount.toLocaleString());
    console.log('   ค่างวด: ฿' + monthlyPayment.toLocaleString() + '/เดือน');

    console.log('\n🎉 การทดสอบเสร็จสิ้น!');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:', error.message);
  }
}

// ฟังก์ชันทดสอบการลบแผนทดสอบ
async function cleanupTestPlans() {
  console.log('\n🧹 ทำความสะอาดแผนทดสอบ...');
  
  try {
    const { data: testPlans, error: fetchError } = await supabase
      .from('installment_plans')
      .select('id, name')
      .like('plan_number', 'CUSTOM-%')
      .like('name', '%ทดสอบ%');

    if (fetchError) {
      console.log('❌ Error:', fetchError.message);
      return;
    }

    if (testPlans.length === 0) {
      console.log('✅ ไม่มีแผนทดสอบที่ต้องลบ');
      return;
    }

    console.log(`📋 พบแผนทดสอบ ${testPlans.length} แผน:`);
    testPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} (ID: ${plan.id})`);
    });

    // ถามผู้ใช้ก่อนลบ (ในการใช้งานจริง)
    console.log('\n⚠️  หากต้องการลบแผนทดสอบ ให้รันคำสั่ง:');
    console.log('   DELETE FROM installment_plans WHERE plan_number LIKE \'CUSTOM-%\' AND name LIKE \'%ทดสอบ%\';');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทำความสะอาด:', error.message);
  }
}

// รันการทดสอบ
if (require.main === module) {
  console.log('🚀 เริ่มต้นการทดสอบฟีเจอร์สร้างแผนกำหนดเอง\n');
  console.log('⚠️  กรุณาตั้งค่า Supabase URL และ Key ก่อนรันการทดสอบ\n');
  
  // แสดงวิธีการใช้งาน
  console.log('📖 วิธีการใช้งาน:');
  console.log('1. แก้ไข supabaseUrl และ supabaseKey ในไฟล์นี้');
  console.log('2. รันคำสั่ง: node test_custom_plan_creation.js');
  console.log('3. ตรวจสอบผลการทดสอบ\n');
  
  // testCustomPlanCreation();
  // cleanupTestPlans();
}

module.exports = {
  testCustomPlanCreation,
  cleanupTestPlans
};