// ===================================================================
// SCRIPT ทดสอบการสร้างสัญญาผ่อนชำระ
// ===================================================================

const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase (ใช้ environment variables จริง)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testContractCreation() {
  console.log('🧪 เริ่มทดสอบการสร้างสัญญาผ่อนชำระ...\n');

  try {
    // 1. ทดสอบสร้างผู้ค้ำประกัน
    console.log('1️⃣ ทดสอบสร้างผู้ค้ำประกัน...');
    const guarantorData = {
      name: 'ทดสอบ ผู้ค้ำประกัน',
      phone: '0812345678',
      email: 'guarantor@test.com',
      address: '123 ถนนทดสอบ เขตทดสอบ กรุงเทพฯ 10100',
      id_card: '1234567890123',
      occupation: 'พนักงานบริษัท',
      monthly_income: 25000,
      workplace: 'บริษัททดสอบ จำกัด',
      work_address: '456 ถนนทำงาน เขตธุรกิจ กรุงเทพฯ 10110',
      emergency_contact_name: 'ผู้ติดต่อฉุกเฉิน',
      emergency_contact_phone: '0898765432',
      emergency_contact_relationship: 'พี่ชาย',
      created_by: null,
      branch_id: null
    };

    const { data: guarantor, error: guarantorError } = await supabase
      .from('guarantors')
      .insert([guarantorData])
      .select()
      .single();

    if (guarantorError) {
      console.error('❌ Error สร้างผู้ค้ำประกัน:', guarantorError);
      return;
    }

    console.log('✅ สร้างผู้ค้ำประกันสำเร็จ:', guarantor.id);

    // 2. ทดสอบสร้างลูกค้า
    console.log('\n2️⃣ ทดสอบสร้างลูกค้า...');
    const customerData = {
      name: 'ทดสอบ ลูกค้า',
      phone: '0887654321',
      email: 'customer@test.com',
      address: '789 ถนนลูกค้า เขตลูกค้า กรุงเทพฯ 10200',
      id_card: '9876543210987',
      occupation: 'ข้าราชการ',
      monthly_income: 12000, // รายได้น้อยกว่า 15,000 -> ต้องมีผู้ค้ำ
      branch_id: null
    };

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (customerError) {
      console.error('❌ Error สร้างลูกค้า:', customerError);
      return;
    }

    console.log('✅ สร้างลูกค้าสำเร็จ:', customer.id);
    console.log('💡 รายได้ลูกค้า:', customer.monthly_income, 'บาท (< 15,000 -> ต้องมีผู้ค้ำ)');

    // 3. ดึงแผนผ่อนชำระ
    console.log('\n3️⃣ ดึงแผนผ่อนชำระ...');
    const { data: plans, error: plansError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (plansError || !plans.length) {
      console.error('❌ Error ดึงแผนผ่อนชำระ:', plansError);
      return;
    }

    const selectedPlan = plans[0];
    console.log('✅ เลือกแผน:', selectedPlan.plan_name);

    // 4. ทดสอบสร้างสัญญา
    console.log('\n4️⃣ ทดสอบสร้างสัญญา...');
    const contractData = {
      contract_number: `TEST-${Date.now()}`,
      status: 'pending',
      transaction_id: crypto.randomUUID(),
      customer_id: customer.id,
      plan_id: selectedPlan.id,
      guarantor_id: guarantor.id, // ใช้ผู้ค้ำประกันที่สร้างไว้
      down_payment: 5000,
      remaining_amount: 45000,
      monthly_payment: selectedPlan.installment_amount,
      financed_amount: 45000,
      total_interest: 0,
      processing_fee: selectedPlan.processing_fee || 0,
      total_payable: 45000,
      contract_date: new Date().toISOString().split('T')[0],
      first_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_payment_date: new Date(Date.now() + selectedPlan.number_of_installments * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paid_installments: 0,
      remaining_installments: selectedPlan.number_of_installments,
      total_paid: 0,
      remaining_balance: 45000,
      collateral: 'ทดสอบหลักประกัน',
      terms: 'เงื่อนไขทดสอบ',
      notes: 'หมายเหตุทดสอบ',
      created_by: null
    };

    const { data: contract, error: contractError } = await supabase
      .from('installment_contracts')
      .insert([contractData])
      .select()
      .single();

    if (contractError) {
      console.error('❌ Error สร้างสัญญา:', contractError);
      return;
    }

    console.log('✅ สร้างสัญญาสำเร็จ:', contract.contract_number);

    // 5. ทดสอบดึงข้อมูลสัญญาพร้อม join
    console.log('\n5️⃣ ทดสอบดึงข้อมูลสัญญาพร้อม join...');
    const { data: contractWithDetails, error: joinError } = await supabase
      .from('installment_contracts')
      .select(`
        *,
        customer:customers(*),
        guarantor:guarantors(*),
        plan:installment_plans(*)
      `)
      .eq('id', contract.id)
      .single();

    if (joinError) {
      console.error('❌ Error ดึงข้อมูลสัญญา:', joinError);
      return;
    }

    console.log('✅ ดึงข้อมูลสัญญาพร้อม join สำเร็จ');
    console.log('📋 รายละเอียด:');
    console.log('   - ลูกค้า:', contractWithDetails.customer.name);
    console.log('   - ผู้ค้ำประกัน:', contractWithDetails.guarantor.name);
    console.log('   - แผน:', contractWithDetails.plan.plan_name);
    console.log('   - สถานะ:', contractWithDetails.status);

    console.log('\n🎉 ทดสอบทั้งหมดสำเร็จ!');

  } catch (error) {
    console.error('💥 Error ในการทดสอบ:', error);
  }
}

// รันการทดสอบ
if (require.main === module) {
  testContractCreation();
}

module.exports = { testContractCreation };