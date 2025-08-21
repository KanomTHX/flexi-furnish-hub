require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyInstallmentPlans() {
  try {
    console.log('🔍 ตรวจสอบข้อมูลแผนผ่อนชำระ...');
    
    // ตรวจสอบตารางทั้งหมด
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('ไม่สามารถดูรายชื่อตารางได้, ลองดึงข้อมูลโดยตรง...');
    } else {
      console.log('📋 ตารางที่มีในฐานข้อมูล:', allTables?.map(t => t.table_name).join(', '));
    }
    
    const { data: plans, error } = await supabase
      .from('installment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error);
      console.log('🔍 ลองตรวจสอบตารางอื่นที่อาจเกี่ยวข้อง...');
      
      // ลองดูตาราง plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*');
      
      if (!plansError && plansData) {
        console.log(`📊 พบข้อมูลในตาราง 'plans': ${plansData.length} รายการ`);
        plansData.forEach((plan, index) => {
          console.log(`${index + 1}. ${JSON.stringify(plan, null, 2)}`);
        });
      }
      
      return;
    }

    console.log(`\n📊 พบแผนผ่อนชำระ: ${plans?.length || 0} แผน\n`);
    
    if (!plans || plans.length === 0) {
      console.log('⚠️  ไม่มีข้อมูลในตาราง installment_plans');
      return;
    }
    
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   - จำนวนงวด: ${plan.number_of_installments} งวด`);
      console.log(`   - ดอกเบี้ย: ${plan.interest_rate}%`);
      console.log(`   - เงินดาวน์: ${plan.down_payment_percent}%`);
      console.log(`   - ค่าธรรมเนียม: ฿${plan.processing_fee?.toLocaleString() || 0}`);
      console.log(`   - วงเงิน: ฿${plan.min_amount?.toLocaleString() || 0} - ฿${plan.max_amount?.toLocaleString() || 0}`);
      console.log(`   - ต้องมีผู้ค้ำ: ${plan.requires_guarantor ? 'ใช่' : 'ไม่'}`);
      console.log(`   - สถานะ: ${plan.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`);
      console.log('');
    });
    
    console.log('✅ การตรวจสอบเสร็จสิ้น');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

verifyInstallmentPlans();