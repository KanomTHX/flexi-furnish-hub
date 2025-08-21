import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addInstallmentPlans() {
  console.log('🔧 กำลังเพิ่มข้อมูลแผนผ่อนชำระ...');

  try {
    // ลบข้อมูลเดิมออกก่อน
    console.log('🗑️ กำลังลบข้อมูลเดิม...');
    const { error: deleteError } = await supabase
      .from('payment_plans')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // ลบข้อมูลทั้งหมด
    
    if (deleteError) {
      console.log('⚠️ ไม่สามารถลบข้อมูลเดิมได้:', deleteError.message);
    } else {
      console.log('✅ ลบข้อมูลเดิมสำเร็จ');
    }

    // ข้อมูลแผนผ่อนชำระตัวอย่าง
    const paymentPlans = [
      {
        plan_number: 'PLAN006',
        name: 'แผนผ่อน 6 เดือน',
        number_of_installments: 6,
        interest_rate: 5.0,
        down_payment_percent: 20.0,
        is_active: true
      },
      {
        plan_number: 'PLAN012',
        name: 'แผนผ่อน 12 เดือน',
        number_of_installments: 12,
        interest_rate: 7.0,
        down_payment_percent: 15.0,
        is_active: true
      },
      {
        plan_number: 'PLAN018',
        name: 'แผนผ่อน 18 เดือน',
        number_of_installments: 18,
        interest_rate: 9.0,
        down_payment_percent: 10.0,
        is_active: true
      },
      {
        plan_number: 'PLAN024',
        name: 'แผนผ่อน 24 เดือน',
        number_of_installments: 24,
        interest_rate: 12.0,
        down_payment_percent: 10.0,
        is_active: true
      },
      {
        plan_number: 'PLAN036',
        name: 'แผนผ่อน 36 เดือน',
        number_of_installments: 36,
        interest_rate: 15.0,
        down_payment_percent: 5.0,
        is_active: true
      }
    ];

    console.log('📝 กำลังเพิ่มข้อมูลแผนผ่อนชำระ...');
    
    let successCount = 0;
    for (const plan of paymentPlans) {
      try {
        const { data, error } = await supabase
          .from('payment_plans')
          .insert([plan])
          .select();

        if (error) {
          console.log(`❌ ไม่สามารถเพิ่ม "${plan.name}" ได้:`, error.message);
        } else {
          console.log(`✅ เพิ่ม "${plan.name}" เรียบร้อย`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ เกิดข้อผิดพลาดกับ "${plan.name}":`, err.message);
      }
    }

    console.log('\n============================================================');
    console.log(`🎉 เพิ่มข้อมูลแผนผ่อนชำระสำเร็จ ${successCount}/${paymentPlans.length} แผน`);
    
    if (successCount > 0) {
      console.log('✅ ตอนนี้ระบบแผนผ่อนชำระพร้อมใช้งานแล้ว!');
    }
    
  } catch (error) {
    console.log('\n============================================================');
    console.log('💥 การเพิ่มข้อมูลแผนผ่อนชำระล้มเหลว!');
    console.log('❌ ข้อผิดพลาด:', error.message);
  }
}

addInstallmentPlans();