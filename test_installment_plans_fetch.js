// ===================================================================
// ทดสอบการดึงแผนผ่อนชำระจากฐานข้อมูล
// ===================================================================

const { createClient } = require('@supabase/supabase-js');

// ตั้งค่า Supabase (ใช้ environment variables จริง)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInstallmentPlansFetch() {
  console.log('🧪 ทดสอบการดึงแผนผ่อนชำระจากฐานข้อมูล...\n');

  try {
    // 1. ดึงแผนผ่อนชำระทั้งหมด
    console.log('1️⃣ ดึงแผนผ่อนชำระทั้งหมด...');
    const { data: allPlans, error: allPlansError } = await supabase
      .from('installment_plans')
      .select('*')
      .order('number_of_installments');

    if (allPlansError) {
      console.error('❌ Error ดึงแผนทั้งหมด:', allPlansError);
      return;
    }

    console.log(`✅ พบแผนทั้งหมด: ${allPlans.length} แผน`);
    allPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_name} (${plan.plan_number})`);
      console.log(`      - ID: ${plan.id} (${typeof plan.id})`);
      console.log(`      - งวด: ${plan.number_of_installments}`);
      console.log(`      - ดอกเบี้ย: ${plan.interest_rate}%`);
      console.log(`      - เงินดาวน์: ${plan.down_payment_percent}%`);
      console.log(`      - ต้องมีผู้ค้ำ: ${plan.requires_guarantor ? 'ใช่' : 'ไม่ใช่'}`);
      console.log(`      - สถานะ: ${plan.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}`);
      console.log('');
    });

    // 2. ดึงเฉพาะแผนที่ใช้งาน
    console.log('2️⃣ ดึงเฉพาะแผนที่ใช้งาน...');
    const { data: activePlans, error: activePlansError } = await supabase
      .from('installment_plans')
      .select('*')
      .eq('is_active', true)
      .order('number_of_installments');

    if (activePlansError) {
      console.error('❌ Error ดึงแผนที่ใช้งาน:', activePlansError);
      return;
    }

    console.log(`✅ พบแผนที่ใช้งาน: ${activePlans.length} แผน`);

    // 3. ทดสอบการแปลงข้อมูลให้ตรงกับ InstallmentPlan type
    console.log('\n3️⃣ ทดสอบการแปลงข้อมูล...');
    const mappedPlans = activePlans.map(plan => ({
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

    console.log('✅ แปลงข้อมูลสำเร็จ:');
    mappedPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}`);
      console.log(`      - ID: ${plan.id} (UUID format: ${isValidUUID(plan.id)})`);
      console.log(`      - งวด: ${plan.months}`);
      console.log(`      - ดอกเบี้ย: ${plan.interestRate}%`);
      console.log(`      - ต้องมีผู้ค้ำ: ${plan.requiresGuarantor ? 'ใช่' : 'ไม่ใช่'}`);
      console.log('');
    });

    // 4. ทดสอบการใช้แผนในการสร้างสัญญา (จำลอง)
    console.log('4️⃣ ทดสอบการใช้แผนในการสร้างสัญญา (จำลอง)...');
    if (mappedPlans.length > 0) {
      const selectedPlan = mappedPlans[0];
      console.log(`✅ เลือกแผน: ${selectedPlan.name}`);
      console.log(`   - Plan ID สำหรับ database: ${selectedPlan.id}`);
      console.log(`   - ประเภท ID: ${typeof selectedPlan.id}`);
      console.log(`   - รูปแบบ UUID ถูกต้อง: ${isValidUUID(selectedPlan.id)}`);
      
      // จำลองข้อมูลสัญญา
      const contractData = {
        plan_id: selectedPlan.id, // ใช้ UUID จากฐานข้อมูล
        plan_name: selectedPlan.name,
        months: selectedPlan.months,
        interest_rate: selectedPlan.interestRate
      };
      
      console.log('   - ข้อมูลสัญญาที่จะส่งไป:', JSON.stringify(contractData, null, 2));
    }

    console.log('\n🎉 การทดสอบเสร็จสิ้น!');
    console.log('\n📊 สรุปผลการทดสอบ:');
    console.log(`   ✅ ดึงแผนจากฐานข้อมูลได้: ${allPlans.length} แผน`);
    console.log(`   ✅ แผนที่ใช้งาน: ${activePlans.length} แผน`);
    console.log(`   ✅ แปลงข้อมูลสำเร็จ: ${mappedPlans.length} แผน`);
    console.log(`   ✅ ID เป็น UUID format ถูกต้อง: ${mappedPlans.every(p => isValidUUID(p.id))}`);

  } catch (error) {
    console.error('💥 Error ในการทดสอบ:', error);
  }
}

/**
 * ตรวจสอบว่า string เป็น UUID format หรือไม่
 */
function isValidUUID(str) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// รันการทดสอบ
if (require.main === module) {
  testInstallmentPlansFetch();
}

module.exports = { testInstallmentPlansFetch };