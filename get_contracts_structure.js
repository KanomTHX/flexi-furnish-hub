import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function getContractsStructure() {
  console.log('🔍 ดึงโครงสร้างของตาราง installment_contracts');
  console.log('================================================================');

  try {
    // ลองใส่ข้อมูลพื้นฐาน
    const basicData = {
      status: 'draft'
    };

    console.log('ลองใส่ข้อมูลพื้นฐาน...');
    const { data, error } = await supabase
      .from('installment_contracts')
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
          let testValue;
          if (requiredColumn.includes('id')) {
            testValue = '00000000-0000-0000-0000-000000000001';
          } else if (requiredColumn.includes('number')) {
            testValue = 'CONTRACT-001';
          } else if (requiredColumn.includes('amount')) {
            testValue = 50000;
          } else if (requiredColumn.includes('date')) {
            testValue = new Date().toISOString().split('T')[0];
          } else {
            testValue = 'test-value';
          }
          
          const testData = {
            ...basicData,
            [requiredColumn]: testValue
          };
          
          console.log(`ลองใส่ ${requiredColumn}: ${testValue}`);
          const { data: testResult, error: testError } = await supabase
            .from('installment_contracts')
            .insert(testData)
            .select();
            
          if (testError) {
            console.log(`❌ ยังมี error: ${testError.message}`);
            
            // ถ้ายังมี NOT NULL constraint อื่น
            if (testError.message.includes('null value in column')) {
              const nextMatch = testError.message.match(/null value in column "([^"]+)"/);
              if (nextMatch) {
                console.log(`⚠️  คอลัมน์ที่ต้องมีค่าต่อไป: ${nextMatch[1]}`);
                
                // ลองใส่ค่าสำหรับคอลัมน์ที่สอง
                let secondValue;
                const secondColumn = nextMatch[1];
                if (secondColumn.includes('id')) {
                  secondValue = '00000000-0000-0000-0000-000000000002';
                } else if (secondColumn.includes('amount')) {
                  secondValue = 5000;
                } else {
                  secondValue = 'test-value-2';
                }
                
                const completeData = {
                  ...testData,
                  [secondColumn]: secondValue
                };
                
                console.log(`ลองใส่ ${secondColumn}: ${secondValue}`);
                const { data: completeResult, error: completeError } = await supabase
                  .from('installment_contracts')
                  .insert(completeData)
                  .select();
                  
                if (completeError) {
                  console.log(`❌ ยังมี error: ${completeError.message}`);
                } else {
                  console.log('✅ Insert สำเร็จ!');
                  if (completeResult && completeResult[0]) {
                    console.log('\n📊 โครงสร้างตาราง installment_contracts:');
                    Object.keys(completeResult[0]).forEach(col => {
                      const value = completeResult[0][col];
                      const type = typeof value;
                      console.log(`   - ${col}: ${type} = ${value}`);
                    });
                    
                    // ลบข้อมูลทดสอบ
                    await supabase
                      .from('installment_contracts')
                      .delete()
                      .eq('id', completeResult[0].id);
                    console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
                  }
                }
              }
            }
          } else {
            console.log('✅ Insert สำเร็จ!');
            if (testResult && testResult[0]) {
              console.log('\n📊 โครงสร้างตาราง installment_contracts:');
              Object.keys(testResult[0]).forEach(col => {
                const value = testResult[0][col];
                const type = typeof value;
                console.log(`   - ${col}: ${type} = ${value}`);
              });
              
              // ลบข้อมูลทดสอบ
              await supabase
                .from('installment_contracts')
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
        console.log('\n📊 โครงสร้างตาราง installment_contracts:');
        Object.keys(data[0]).forEach(col => {
          const value = data[0][col];
          const type = typeof value;
          console.log(`   - ${col}: ${type} = ${value}`);
        });
        
        // ลบข้อมูลทดสอบ
        await supabase
          .from('installment_contracts')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

getContractsStructure();