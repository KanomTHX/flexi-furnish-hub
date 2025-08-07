// ===================================================================
// สคริปต์ตั้งค่าแผนผ่อนชำระแบบปลอดภัย
// ===================================================================

import { createClient } from '@supabase/supabase-js';

// ตั้งค่า Supabase (อ่านจาก .env.local file)
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupInstallmentPlans() {
  console.log('🚀 เริ่มตั้งค่าแผนผ่อนชำระ...\n');

  try {
    // 1. ตรวจสอบการเชื่อมต่อฐานข้อมูล
    console.log('1️⃣ ตรวจสอบการเชื่อมต่อฐานข้อมูล...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('installment_plans')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', connectionError.message);
      console.log('💡 กรุณาตรวจสอบ:');
      console.log('   - ตัวแปร VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY');
      console.log('   - ตาราง installment_plans ถูกสร้างแล้วหรือไม่');
      return false;
    }

    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // 2. ตรวจสอบแผนที่มีอยู่
    console.log('\n2️⃣ ตรวจสอบแผนที่มีอยู่...');
    const { data: existingPlans, error: checkError } = await supabase
      .from('installment_plans')
      .select('plan_number, plan_name, is_active');

    if (checkError) {
      console.error('❌ Error ตรวจสอบแผน:', checkError);
      return false;
    }

    console.log(`📋 พบแผนในฐานข้อมูล: ${existingPlans.length} แผน`);
    if (existingPlans.length > 0) {
      existingPlans.forEach(plan => {
        console.log(`   - ${plan.plan_number}: ${plan.plan_name} (${plan.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'})`);
      });
    }

    // 3. สร้างแผนที่ขาดหายไป
    console.log('\n3️⃣ สร้างแผนที่จำเป็น...');
    
    const requiredPlans = [
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

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const planData of requiredPlans) {
      const existingPlan = existingPlans.find(p => p.plan_number === planData.plan_number);
      
      if (existingPlan) {
        if (!existingPlan.is_active) {
          // อัปเดตแผนที่ไม่ได้ใช้งานให้ใช้งานได้
          const { error: updateError } = await supabase
            .from('installment_plans')
            .update({ is_active: true, status: 'active' })
            .eq('plan_number', planData.plan_number);

          if (updateError) {
            console.error(`❌ Error อัปเดต ${planData.plan_number}:`, updateError);
          } else {
            console.log(`🔄 อัปเดต ${planData.plan_number}: เปิดใช้งาน`);
            updatedCount++;
          }
        } else {
          console.log(`⏭️  ข้าม ${planData.plan_number}: มีอยู่แล้วและใช้งานอยู่`);
          skippedCount++;
        }
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
      createdCount++;
    }

    // 4. สรุปผลและแสดงแผนทั้งหมด
    console.log('\n4️⃣ สรุปผลการตั้งค่า...');
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
    console.log(`   🔄 อัปเดตแผน: ${updatedCount} แผน`);
    console.log(`   ⏭️  ข้ามแผนที่มีอยู่: ${skippedCount} แผน`);
    console.log(`   📋 แผนที่ใช้งานได้ทั้งหมด: ${finalPlans.length} แผน`);

    console.log(`\n📋 รายการแผนที่พร้อมใช้งาน:`);
    finalPlans.forEach((plan, index) => {
      console.log(`\n   ${index + 1}. ${plan.plan_name} (${plan.plan_number})`);
      console.log(`      📅 งวด: ${plan.number_of_installments} เดือน`);
      console.log(`      💰 ดอกเบี้ย: ${plan.interest_rate}% ต่อปี`);
      console.log(`      💳 เงินดาวน์: ${plan.down_payment_percent}%`);
      console.log(`      💵 ยอดเงิน: ${plan.min_amount.toLocaleString()} - ${plan.max_amount.toLocaleString()} บาท`);
      console.log(`      🤝 ต้องมีผู้ค้ำ: ${plan.requires_guarantor ? 'ใช่' : 'ไม่ใช่'}`);
      console.log(`      🆔 ID: ${plan.id}`);
    });

    // 5. ทดสอบการใช้งาน
    console.log('\n5️⃣ ทดสอบการใช้งานแผน...');
    const noGuarantorPlans = finalPlans.filter(p => !p.requires_guarantor);
    const guarantorPlans = finalPlans.filter(p => p.requires_guarantor);

    console.log(`✅ แผนที่ไม่ต้องมีผู้ค้ำประกัน: ${noGuarantorPlans.length} แผน`);
    noGuarantorPlans.forEach(plan => {
      console.log(`   - ${plan.plan_name} (${plan.number_of_installments} เดือน)`);
    });

    console.log(`✅ แผนที่ต้องมีผู้ค้ำประกัน: ${guarantorPlans.length} แผน`);
    guarantorPlans.forEach(plan => {
      console.log(`   - ${plan.plan_name} (${plan.number_of_installments} เดือน)`);
    });

    console.log('\n🎉 การตั้งค่าแผนผ่อนชำระเสร็จสมบูรณ์!');
    console.log('\n💡 ตอนนี้คุณสามารถใช้งานระบบผ่อนชำระได้แล้ว');
    console.log('   - เปิดหน้า Installments ในระบบ');
    console.log('   - กดปุ่ม "สร้างสัญญาใหม่"');
    console.log('   - เลือกแผนผ่อนชำระที่เหมาะสม');

    return true;

  } catch (error) {
    console.error('💥 Error ในการตั้งค่าแผน:', error);
    return false;
  }
}

// รันการตั้งค่า
setupInstallmentPlans().then(success => {
  if (success) {
    console.log('\n✅ การตั้งค่าเสร็จสมบูรณ์');
    process.exit(0);
  } else {
    console.log('\n❌ การตั้งค่าล้มเหลว');
    process.exit(1);
  }
});

export { setupInstallmentPlans };