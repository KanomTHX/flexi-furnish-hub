// ===================================================================
// สคริปต์สร้างแผนผ่อนชำระในฐานข้อมูล
// ===================================================================

const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase (ใช้ environment variables จริง)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ข้อมูลแผนผ่อนชำระ
 */
const installmentPlansData = [
  {
    plan_number: 'PLAN003',
    plan_name: 'ผ่อน 0% 3 เดือน',
    description: 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาไม่สูง',
    number_of_installments: 3,
    interest_rate: 0,
    down_payment_percent: 30,
    processing_fee: 200,
    min_amount: 5000,
    max_amount: 30000,
    requires_guarantor: false,
    is_active: true,
    status: 'active'
  },
  {
    plan_number: 'PLAN006',
    plan_name: 'ผ่อน 0% 6 เดือน',
    description: 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาปานกลาง',
    number_of_installments: 6,
    interest_rate: 0,
    down_payment_percent: 20,
    processing_fee: 300,
    min_amount: 10000,
    max_amount: 50000,
    requires_guarantor: false,
    is_active: true,
    status: 'active'
  },
  {
    plan_number: 'PLAN009',
    plan_name: 'ผ่อน 3% 9 เดือน',
    description: 'ผ่อนชำระ 9 งวด ดอกเบี้ย 3% ต่อปี เหมาะสำหรับสินค้าราคาปานกลาง',
    number_of_installments: 9,
    interest_rate: 3,
    down_payment_percent: 15,
    processing_fee: 400,
    min_amount: 15000,
    max_amount: 80000,
    requires_guarantor: false,
    is_active: true,
    status: 'active'
  },
  {
    plan_number: 'PLAN012',
    plan_name: 'ผ่อน 5% 12 เดือน',
    description: 'ผ่อนชำระ 12 งวด ดอกเบี้ย 5% ต่อปี เหมาะสำหรับสินค้าราคาสูง',
    number_of_installments: 12,
    interest_rate: 5,
    down_payment_percent: 10,
    processing_fee: 500,
    min_amount: 20000,
    max_amount: 150000,
    requires_guarantor: false,
    is_active: true,
    status: 'active'
  },
  {
    plan_number: 'PLAN024',
    plan_name: 'ผ่อน 8% 24 เดือน',
    description: 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี เหมาะสำหรับสินค้าราคาสูง ต้องมีผู้ค้ำประกัน',
    number_of_installments: 24,
    interest_rate: 8,
    down_payment_percent: 10,
    processing_fee: 1000,
    min_amount: 50000,
    max_amount: 300000,
    requires_guarantor: true,
    is_active: true,
    status: 'active'
  }
];

async function createInstallmentPlans() {
  console.log('🏗️  เริ่มสร้างแผนผ่อนชำระในฐานข้อมูล...\n');

  try {
    // 1. ตรวจสอบว่าตาราง installment_plans มีอยู่หรือไม่
    console.log('1️⃣ ตรวจสอบตาราง installment_plans...');
    const { data: existingPlans, error: checkError } = await supabase
      .from('installment_plans')
      .select('plan_number')
      .limit(1);

    if (checkError) {
      console.error('❌ Error ตรวจสอบตาราง:', checkError);
      console.log('💡 ตาราง installment_plans อาจยังไม่ได้ถูกสร้าง กรุณารัน migration ก่อน');
      return;
    }

    console.log('✅ ตาราง installment_plans พร้อมใช้งาน');

    // 2. ตรวจสอบแผนที่มีอยู่แล้ว
    console.log('\n2️⃣ ตรวจสอบแผนที่มีอยู่แล้ว...');
    const { data: allExistingPlans, error: existingError } = await supabase
      .from('installment_plans')
      .select('plan_number, plan_name');

    if (existingError) {
      console.error('❌ Error ตรวจสอบแผนที่มีอยู่:', existingError);
      return;
    }

    if (allExistingPlans && allExistingPlans.length > 0) {
      console.log(`📋 พบแผนที่มีอยู่แล้ว: ${allExistingPlans.length} แผน`);
      allExistingPlans.forEach(plan => {
        console.log(`   - ${plan.plan_number}: ${plan.plan_name}`);
      });
    } else {
      console.log('📋 ยังไม่มีแผนในฐานข้อมูล');
    }

    // 3. สร้างแผนใหม่
    console.log('\n3️⃣ สร้างแผนผ่อนชำระใหม่...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const planData of installmentPlansData) {
      // ตรวจสอบว่าแผนนี้มีอยู่แล้วหรือไม่
      const existingPlan = allExistingPlans?.find(p => p.plan_number === planData.plan_number);
      
      if (existingPlan) {
        console.log(`⏭️  ข้าม ${planData.plan_number} (มีอยู่แล้ว)`);
        skippedCount++;
        continue;
      }

      // สร้างแผนใหม่
      const { data: newPlan, error: createError } = await supabase
        .from('installment_plans')
        .insert([planData])
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error สร้าง ${planData.plan_number}:`, createError);
        continue;
      }

      console.log(`✅ สร้าง ${planData.plan_number}: ${planData.plan_name}`);
      console.log(`   - งวด: ${planData.number_of_installments} เดือน`);
      console.log(`   - ดอกเบี้ย: ${planData.interest_rate}% ต่อปี`);
      console.log(`   - เงินดาวน์: ${planData.down_payment_percent}%`);
      console.log(`   - ยอดเงิน: ${planData.min_amount.toLocaleString()} - ${planData.max_amount.toLocaleString()} บาท`);
      console.log(`   - ต้องมีผู้ค้ำ: ${planData.requires_guarantor ? 'ใช่' : 'ไม่ใช่'}`);
      console.log(`   - ID: ${newPlan.id}`);
      console.log('');
      
      createdCount++;
    }

    // 4. สรุปผลการสร้าง
    console.log('4️⃣ สรุปผลการสร้างแผน...');
    const { data: finalPlans, error: finalError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('is_active', true)
      .order('number_of_installments');

    if (finalError) {
      console.error('❌ Error ดึงข้อมูลสรุป:', finalError);
      return;
    }

    console.log(`\n📊 สรุปผลการดำเนินการ:`);
    console.log(`   ✅ สร้างแผนใหม่: ${createdCount} แผน`);
    console.log(`   ⏭️  ข้ามแผนที่มีอยู่: ${skippedCount} แผน`);
    console.log(`   📋 แผนทั้งหมดในระบบ: ${finalPlans.length} แผน`);

    console.log(`\n📋 รายการแผนทั้งหมด:`);
    finalPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_name} (${plan.plan_number})`);
      console.log(`      - งวด: ${plan.number_of_installments} เดือน`);
      console.log(`      - ดอกเบี้ย: ${plan.interest_rate}% ต่อปี`);
      console.log(`      - เงินดาวน์: ${plan.down_payment_percent}%`);
      console.log(`      - ยอดเงิน: ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()} บาท`);
      console.log(`      - ต้องมีผู้ค้ำ: ${plan.requires_guarantor ? 'ใช่' : 'ไม่ใช่'}`);
      console.log(`      - ID: ${plan.id}`);
      console.log('');
    });

    // 5. ทดสอบการดึงข้อมูลแผน
    console.log('5️⃣ ทดสอบการดึงข้อมูลแผนสำหรับ UI...');
    const mappedPlans = finalPlans.map(plan => ({
      id: plan.id,
      name: plan.plan_name,
      planNumber: plan.plan_number,
      months: plan.number_of_installments,
      interestRate: plan.interest_rate,
      downPaymentPercent: plan.down_payment_percent,
      processingFee: plan.processing_fee,
      minAmount: plan.min_amount,
      maxAmount: plan.max_amount,
      requiresGuarantor: plan.requires_guarantor,
      isActive: plan.is_active
    }));

    console.log('✅ แปลงข้อมูลสำหรับ UI สำเร็จ');
    console.log(`   - จำนวนแผนที่พร้อมใช้: ${mappedPlans.length} แผน`);
    console.log(`   - แผนที่ไม่ต้องมีผู้ค้ำ: ${mappedPlans.filter(p => !p.requiresGuarantor).length} แผน`);
    console.log(`   - แผนที่ต้องมีผู้ค้ำ: ${mappedPlans.filter(p => p.requiresGuarantor).length} แผน`);

    console.log('\n🎉 การสร้างแผนผ่อนชำระเสร็จสมบูรณ์!');
    console.log('\n💡 ตอนนี้คุณสามารถใช้งานระบบผ่อนชำระได้แล้ว');

  } catch (error) {
    console.error('💥 Error ในการสร้างแผน:', error);
  }
}

// รันการสร้างแผน
if (require.main === module) {
  createInstallmentPlans();
}

module.exports = { createInstallmentPlans, installmentPlansData };