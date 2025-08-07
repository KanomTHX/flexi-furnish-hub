import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function findCorrectColumnNames() {
  console.log('🔍 หาชื่อคอลัมน์ที่ถูกต้องใน installment_payments');
  console.log('================================================================');

  try {
    // ลองใส่ข้อมูลที่มีเฉพาะคอลัมน์พื้นฐาน
    const basicData = {
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      late_fee: 0,
      discount: 0
    };

    console.log('1. ลองใส่ข้อมูลพื้นฐาน...');
    const { data, error } = await supabase
      .from('installment_payments')
      .insert(basicData)
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      
      // ถ้า error เกี่ยวกับ NOT NULL constraint
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          const requiredColumn = match[1];
          console.log(`⚠️  คอลัมน์ที่ต้องมีค่า: ${requiredColumn}`);
          
          // ลองใส่ค่าสำหรับคอลัมน์ที่จำเป็น
          console.log(`\n2. ลองใส่ค่าสำหรับ ${requiredColumn}...`);
          
          let testValue;
          if (requiredColumn.includes('id')) {
            testValue = '00000000-0000-0000-0000-000000000001';
          } else if (requiredColumn.includes('number')) {
            testValue = 1;
          } else if (requiredColumn.includes('amount')) {
            testValue = 5000;
          } else {
            testValue = 'test-value';
          }
          
          const testData = {
            ...basicData,
            [requiredColumn]: testValue
          };
          
          const { data: testResult, error: testError } = await supabase
            .from('installment_payments')
            .insert(testData)
            .select();
            
          if (testError) {
            console.log(`❌ ยังมี error: ${testError.message}`);
            
            // ถ้ายังมี NOT NULL constraint อื่น
            if (testError.message.includes('null value in column')) {
              const nextMatch = testError.message.match(/null value in column "([^"]+)"/);
              if (nextMatch) {
                console.log(`⚠️  คอลัมน์ที่ต้องมีค่าต่อไป: ${nextMatch[1]}`);
              }
            }
          } else {
            console.log('✅ Insert สำเร็จ!');
            if (testResult && testResult[0]) {
              console.log('\n📊 คอลัมน์ทั้งหมดในตาราง:');
              Object.keys(testResult[0]).forEach(col => {
                console.log(`   - ${col}: ${typeof testResult[0][col]} = ${testResult[0][col]}`);
              });
              
              // ลบข้อมูลทดสอบ
              await supabase
                .from('installment_payments')
                .delete()
                .eq('id', testResult[0].id);
              console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
            }
          }
        }
      }
    } else {
      console.log('✅ Insert สำเร็จ!');
      if (data && data[0]) {
        console.log('\n📊 คอลัมน์ทั้งหมดในตาราง:');
        Object.keys(data[0]).forEach(col => {
          console.log(`   - ${col}: ${typeof data[0][col]} = ${data[0][col]}`);
        });
        
        // ลบข้อมูลทดสอบ
        await supabase
          .from('installment_payments')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
      }
    }

    // ตรวจสอบตารางอื่นเพื่อเข้าใจ naming convention
    console.log('\n🔍 ตรวจสอบ naming convention จากตารางอื่น:');
    
    // ตรวจสอบ installment_plans
    const { data: plansData } = await supabase
      .from('installment_plans')
      .select('*')
      .limit(1);
      
    if (plansData && plansData.length > 0) {
      console.log('\ninstallment_plans columns:');
      Object.keys(plansData[0]).forEach(col => {
        if (col.includes('id')) {
          console.log(`   - ${col} (ID field)`);
        }
      });
    }

    // ตรวจสอบ guarantors
    const { data: guarantorsData } = await supabase
      .from('guarantors')
      .select('*')
      .limit(1);
      
    if (guarantorsData && guarantorsData.length > 0) {
      console.log('\nguarantors columns:');
      Object.keys(guarantorsData[0]).forEach(col => {
        if (col.includes('id')) {
          console.log(`   - ${col} (ID field)`);
        }
      });
    } else {
      console.log('\nguarantors: ตารางว่าง');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

findCorrectColumnNames();