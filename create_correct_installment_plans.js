import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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

async function createCorrectInstallmentPlans() {
  console.log('🚀 สร้างแผนผ่อนชำระด้วยโครงสร้างที่ถูกต้อง...\n');

  try {
    // ข้อมูลแผนผ่อนชำระ (ใช้ column names ที่ถูกต้อง)
    const installmentPlansData = [
      {
        plan_number: 'PLAN003',
        name: 'ผ่อน 0% 3 เดือน',
        description: 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาไม่สูง',
        number_of_installments: 3,
        interest_rate: 0,
        down_payment_percent: 30,
        processing_fee: 200,
        total_amount: 30000, // ยอดสูงสุด
        installment_amount: 10000, // ประมาณค่างวด
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      },
      {
        plan_number: 'PLAN006',
        name: 'ผ่อน 0% 6 เดือน',
        description: 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย เหมาะสำหรับสินค้าราคาปานกลาง',
        number_of_installments: 6,
        interest_rate: 0,
        down_payment_percent: 20,
        processing_fee: 300,
        total_amount: 50000,
        installment_amount: 8000,
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      },
      {
        plan_number: 'PLAN009',
        name: 'ผ่อน 3% 9 เดือน',
        description: 'ผ่อนชำระ 9 งวด ดอกเบี้ย 3% ต่อปี เหมาะสำหรับสินค้าราคาปานกลาง',
        number_of_installments: 9,
        interest_rate: 3,
        down_payment_percent: 15,
        processing_fee: 400,
        total_amount: 80000,
        installment_amount: 9000,
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      },
      {
        plan_number: 'PLAN012',
        name: 'ผ่อน 5% 12 เดือน',
        description: 'ผ่อนชำระ 12 งวด ดอกเบี้ย 5% ต่อปี เหมาะสำหรับสินค้าราคาสูง',
        number_of_installments: 12,
        interest_rate: 5,
        down_payment_percent: 10,
        processing_fee: 500,
        total_amount: 150000,
        installment_amount: 12500,
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      },
      {
        plan_number: 'PLAN024',
        name: 'ผ่อน 8% 24 เดือน',
        description: 'ผ่อนชำระ 24 งวด ดอกเบี้ย 8% ต่อปี เหมาะสำหรับสินค้าราคาสูง ต้องมีผู้ค้ำประกัน',
        number_of_installments: 24,
        interest_rate: 8,
        down_payment_percent: 10,
        processing_fee: 1000,
        total_amount: 300000,
        installment_amount: 15000,
        is_active: true,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        branch_id: null
      }
    ];

    // 1. ตรวจสอบแผนที่มีอยู่
    console.log('1️⃣ ตรวจสอบแผนที่มีอยู่...');
    const { data: existingPlans, error: checkError } = await supabase
      .from('installment_plans')
      .select('plan_number, name');

    if (checkError) {
      console.error('❌ Error ตรวจสอบแผน:', checkError);
      return false;
    }

    console.log(`📋 พบแผนในฐานข้อมูล: ${existingPlans.length} แผน`);
    if (existingPlans.length > 0) {
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.plan_number}: ${plan.name}`);
      });
    }

    // 2. สร้างแผนใหม่
    console.log('\n2️⃣ สร้างแผนผ่อนชำระใหม่...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const planData of installmentPlansData) {
      // ตรวจสอบว่าแผนนี้มีอยู่แล้วหรือไม่
      const existingPlan = existingPlans?.find(p => p.plan_number === planData.plan_number);
      
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

      console.log(`✅ สร้าง ${planData.plan_number}: ${planData.name}`);
      console.log(`   - งวด: ${planData.number_of_installments} เดือน`);
      console.log(`   - ดอกเบี้ย: ${planData.interest_rate}% ต่อปี`);
      console.log(`   - เงินดาวน์: ${planData.down_payment_percent}%`);
      console.log(`   - ยอดเงินสูงสุด: ${planData.total_amount.toLocaleString()} บาท`);
      console.log(`   - ID: ${newPlan.id}`);
      console.log('');
      
      createdCount++;
    }

    // 3. สรุปผลการสร้าง
    console.log('3️⃣ สรุปผลการสร้างแผน...');
    const { data: finalPlans, error: finalError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('is_active', true)
      .order('number_of_installments');

    if (finalError) {
      console.error('❌ Error ดึงข้อมูลสรุป:', finalError);
      return false;
    }

    console.log(`\n📊 สรุปผลการดำเนินการ:`);
    console.log(`   ✅ สร้างแผนใหม่: ${createdCount} แผน`);
    console.log(`   ⏭️  ข้ามแผนที่มีอยู่: ${skippedCount} แผน`);
    console.log(`   📋 แผนทั้งหมดในระบบ: ${finalPlans.length} แผน`);

    console.log(`\n📋 รายการแผนทั้งหมด:`);
    finalPlans.forEach((plan, index) => {
      console.log(`\n   ${index + 1}. ${plan.name} (${plan.plan_number || 'ไม่มี plan_number'})`);
      console.log(`      📅 งวด: ${plan.number_of_installments} เดือน`);
      console.log(`      💰 ดอกเบี้ย: ${plan.interest_rate}% ต่อปี`);
      console.log(`      💳 เงินดาวน์: ${plan.down_payment_percent}%`);
      console.log(`      💵 ยอดเงินสูงสุด: ${plan.total_amount?.toLocaleString() || 'ไม่ระบุ'} บาท`);
      console.log(`      🆔 ID: ${plan.id}`);
    });

    console.log('\n🎉 การสร้างแผนผ่อนชำระเสร็จสมบูรณ์!');
    console.log('\n💡 ตอนนี้คุณสามารถใช้งานระบบผ่อนชำระได้แล้ว');

    return true;

  } catch (error) {
    console.error('💥 Error ในการสร้างแผน:', error);
    return false;
  }
}

// รันการสร้างแผน
createCorrectInstallmentPlans().then(success => {
  if (success) {
    console.log('\n✅ การสร้างแผนเสร็จสมบูรณ์');
    process.exit(0);
  } else {
    console.log('\n❌ การสร้างแผนล้มเหลว');
    process.exit(1);
  }
});