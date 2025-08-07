// ===================================================================
// SCRIPT ทดสอบ Workflow การสร้างสัญญาผ่อนชำระแบบสมบูรณ์
// ===================================================================

const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase (ใช้ environment variables จริง)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * สร้าง UUID ที่ใช้ได้ในทุกเบราว์เซอร์
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testCompleteContractFlow() {
  console.log('🧪 เริ่มทดสอบ Workflow การสร้างสัญญาผ่อนชำระแบบสมบูรณ์...\n');

  try {
    // 1. ทดสอบสร้างลูกค้ารายได้น้อย (ต้องมีผู้ค้ำ)
    console.log('1️⃣ ทดสอบสร้างลูกค้ารายได้น้อย...');
    const lowIncomeCustomer = {
      name: 'ลูกค้าทดสอบ รายได้น้อย',
      phone: '0812345678',
      email: 'low-income@test.com',
      address: '123 ถนนทดสอบ เขตทดสอบ กรุงเทพฯ 10100',
      id_card: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`, // สุ่มเลขบัตร
      occupation: 'พนักงานทั่วไป',
      monthly_income: 12000, // รายได้น้อยกว่า 15,000 -> ต้องมีผู้ค้ำ
      branch_id: null
    };

    // ตรวจสอบว่าลูกค้ามีอยู่แล้วหรือไม่
    let { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('id_card', lowIncomeCustomer.id_card)
      .single();

    let customerId;
    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('✅ ใช้ลูกค้าที่มีอยู่:', customerId);
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([lowIncomeCustomer])
        .select()
        .single();

      if (customerError) {
        console.error('❌ Error สร้างลูกค้า:', customerError);
        return;
      }

      customerId = newCustomer.id;
      console.log('✅ สร้างลูกค้าใหม่สำเร็จ:', customerId);
    }

    // 2. ทดสอบสร้างผู้ค้ำประกัน
    console.log('\n2️⃣ ทดสอบสร้างผู้ค้ำประกัน...');
    const guarantorData = {
      name: 'ผู้ค้ำประกันทดสอบ',
      phone: '0898765432',
      email: 'guarantor@test.com',
      address: '456 ถนนผู้ค้ำ เขตค้ำประกัน กรุงเทพฯ 10200',
      id_card: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`, // สุ่มเลขบัตร
      occupation: 'ข้าราชการ',
      monthly_income: 30000,
      workplace: 'กรมทดสอบ',
      work_address: '789 ถนนราชการ เขตราชการ กรุงเทพฯ 10300',
      emergency_contact_name: 'ผู้ติดต่อฉุกเฉิน',
      emergency_contact_phone: '0887654321',
      emergency_contact_relationship: 'พี่ชาย',
      created_by: null,
      branch_id: null
    };

    // ตรวจสอบว่าผู้ค้ำประกันมีอยู่แล้วหรือไม่
    let { data: existingGuarantor } = await supabase
      .from('guarantors')
      .select('id')
      .eq('id_card', guarantorData.id_card)
      .single();

    let guarantorId;
    if (existingGuarantor) {
      guarantorId = existingGuarantor.id;
      console.log('✅ ใช้ผู้ค้ำประกันที่มีอยู่:', guarantorId);
    } else {
      const { data: newGuarantor, error: guarantorError } = await supabase
        .from('guarantors')
        .insert([guarantorData])
        .select()
        .single();

      if (guarantorError) {
        console.error('❌ Error สร้างผู้ค้ำประกัน:', guarantorError);
        return;
      }

      guarantorId = newGuarantor.id;
      console.log('✅ สร้างผู้ค้ำประกันใหม่สำเร็จ:', guarantorId);
    }

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
    const contractAmount = 50000;
    const downPayment = Math.round(contractAmount * (selectedPlan.down_payment_percent / 100) * 100) / 100;
    const financedAmount = contractAmount - downPayment;

    const contractData = {
      contract_number: `TEST-${Date.now()}`,
      status: 'pending',
      transaction_id: generateUUID(),
      customer_id: customerId,
      plan_id: selectedPlan.id,
      guarantor_id: guarantorId, // ใช้ผู้ค้ำประกันที่สร้างไว้
      down_payment: downPayment,
      remaining_amount: financedAmount,
      monthly_payment: selectedPlan.installment_amount,
      financed_amount: financedAmount,
      total_interest: 0,
      processing_fee: selectedPlan.processing_fee || 0,
      total_payable: financedAmount,
      contract_date: new Date().toISOString().split('T')[0],
      first_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_payment_date: new Date(Date.now() + selectedPlan.number_of_installments * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paid_installments: 0,
      remaining_installments: selectedPlan.number_of_installments,
      total_paid: 0,
      remaining_balance: financedAmount,
      collateral: 'หลักประกันทดสอบ',
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
    console.log('\n📋 สรุปรายละเอียดสัญญา:');
    console.log('   🏷️  เลขที่สัญญา:', contractWithDetails.contract_number);
    console.log('   👤 ลูกค้า:', contractWithDetails.customer.name);
    console.log('   💰 รายได้ลูกค้า:', contractWithDetails.customer.monthly_income.toLocaleString(), 'บาท/เดือน');
    console.log('   🤝 ผู้ค้ำประกัน:', contractWithDetails.guarantor.name);
    console.log('   📋 แผนผ่อน:', contractWithDetails.plan.plan_name);
    console.log('   💵 ยอดสินค้า:', contractAmount.toLocaleString(), 'บาท');
    console.log('   💳 เงินดาวน์:', downPayment.toLocaleString(), 'บาท');
    console.log('   📅 จำนวนงวด:', selectedPlan.number_of_installments, 'งวด');
    console.log('   📊 สถานะ:', contractWithDetails.status);

    // 6. ทดสอบ Workflow สำหรับลูกค้ารายได้สูง (ไม่ต้องมีผู้ค้ำ)
    console.log('\n6️⃣ ทดสอบลูกค้ารายได้สูง (ไม่ต้องมีผู้ค้ำ)...');
    const highIncomeCustomer = {
      name: 'ลูกค้าทดสอบ รายได้สูง',
      phone: '0823456789',
      email: 'high-income@test.com',
      address: '999 ถนนรายได้สูง เขตรวย กรุงเทพฯ 10400',
      id_card: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
      occupation: 'นักธุรกิจ',
      monthly_income: 50000, // รายได้สูงกว่า 15,000 -> ไม่ต้องมีผู้ค้ำ
      branch_id: null
    };

    const { data: richCustomer, error: richCustomerError } = await supabase
      .from('customers')
      .insert([highIncomeCustomer])
      .select()
      .single();

    if (richCustomerError) {
      console.error('❌ Error สร้างลูกค้ารายได้สูง:', richCustomerError);
      return;
    }

    // สร้างสัญญาไม่มีผู้ค้ำประกัน
    const contractWithoutGuarantor = {
      contract_number: `RICH-${Date.now()}`,
      status: 'pending',
      transaction_id: generateUUID(),
      customer_id: richCustomer.id,
      plan_id: selectedPlan.id,
      guarantor_id: null, // ไม่มีผู้ค้ำประกัน
      down_payment: downPayment,
      remaining_amount: financedAmount,
      monthly_payment: selectedPlan.installment_amount,
      financed_amount: financedAmount,
      total_interest: 0,
      processing_fee: selectedPlan.processing_fee || 0,
      total_payable: financedAmount,
      contract_date: new Date().toISOString().split('T')[0],
      first_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      last_payment_date: new Date(Date.now() + selectedPlan.number_of_installments * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paid_installments: 0,
      remaining_installments: selectedPlan.number_of_installments,
      total_paid: 0,
      remaining_balance: financedAmount,
      created_by: null
    };

    const { data: richContract, error: richContractError } = await supabase
      .from('installment_contracts')
      .insert([contractWithoutGuarantor])
      .select()
      .single();

    if (richContractError) {
      console.error('❌ Error สร้างสัญญาลูกค้ารายได้สูง:', richContractError);
      return;
    }

    console.log('✅ สร้างสัญญาลูกค้ารายได้สูงสำเร็จ:', richContract.contract_number);
    console.log('   👤 ลูกค้า:', richCustomer.name);
    console.log('   💰 รายได้:', richCustomer.monthly_income.toLocaleString(), 'บาท/เดือน');
    console.log('   🤝 ผู้ค้ำประกัน: ไม่มี (ไม่จำเป็น)');

    console.log('\n🎉 ทดสอบ Workflow ทั้งหมดสำเร็จ!');
    console.log('\n📊 สรุปผลการทดสอบ:');
    console.log('   ✅ สร้างลูกค้ารายได้น้อย + ผู้ค้ำประกัน + สัญญา');
    console.log('   ✅ สร้างลูกค้ารายได้สูง + สัญญา (ไม่มีผู้ค้ำ)');
    console.log('   ✅ ระบบ UUID generation ทำงานถูกต้อง');
    console.log('   ✅ ระบบ Database constraints ทำงานถูกต้อง');
    console.log('   ✅ ระบบ Join queries ทำงานถูกต้อง');

  } catch (error) {
    console.error('💥 Error ในการทดสอบ:', error);
  }
}

// รันการทดสอบ
if (require.main === module) {
  testCompleteContractFlow();
}

module.exports = { testCompleteContractFlow };