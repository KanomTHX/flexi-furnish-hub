import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function discoverActualStructure() {
  console.log('🔍 ค้นหาโครงสร้างจริงของตาราง installment_payments');
  console.log('================================================================');

  try {
    // ลองใส่ข้อมูลที่มีเฉพาะคอลัมน์ที่รู้ว่ามีอยู่
    const knownColumns = {
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      payment_method: 'cash',
      late_fee: 0,
      discount: 0,
      notes: 'test',
      processed_by: 'test-user'
    };

    console.log('ลองใส่ข้อมูลด้วยคอลัมน์ที่รู้ว่ามี...');
    const { data, error } = await supabase
      .from('installment_payments')
      .insert(knownColumns)
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      
      // ถ้า error เกี่ยวกับ NOT NULL constraint
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`⚠️  คอลัมน์ที่ต้องมีค่า (NOT NULL): ${match[1]}`);
          
          // ลองหาชื่อคอลัมน์ที่ถูกต้องสำหรับ contract reference
          const possibleContractColumns = [
            'installment_contract_id',
            'contract_id', 
            'installment_id',
            'sale_id',
            'transaction_id'
          ];
          
          console.log('\n🔍 ทดสอบชื่อคอลัมน์ที่เป็นไปได้สำหรับ contract reference:');
          for (const colName of possibleContractColumns) {
            try {
              const testData = {
                ...knownColumns,
                [colName]: '00000000-0000-0000-0000-000000000001'
              };
              
              const { error: testError } = await supabase
                .from('installment_payments')
                .insert(testData);
                
              if (testError) {
                if (testError.message.includes(`Could not find the '${colName}' column`)) {
                  console.log(`❌ ${colName}: ไม่มีอยู่`);
                } else if (testError.message.includes(`column "${colName}" does not exist`)) {
                  console.log(`❌ ${colName}: ไม่มีอยู่`);
                } else {
                  console.log(`🔍 ${colName}: ${testError.message}`);
                }
              } else {
                console.log(`✅ ${colName}: มีอยู่!`);
              }
            } catch (err) {
              console.log(`🔍 ${colName}: ${err.message}`);
            }
          }
        }
      }
    } else {
      console.log('✅ Insert สำเร็จ!');
      if (data && data[0]) {
        console.log('คอลัมน์ที่มีอยู่:');
        Object.keys(data[0]).forEach(col => {
          console.log(`   - ${col}: ${data[0][col]}`);
        });
        
        // ลบข้อมูลทดสอบ
        await supabase
          .from('installment_payments')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
      }
    }

    // ลองดูว่าตารางอื่นใช้ชื่อคอลัมน์อะไรสำหรับ reference
    console.log('\n🔍 ตรวจสอบตารางอื่นเพื่อหาชื่อคอลัมน์ที่ถูกต้อง:');
    
    // ตรวจสอบ installment_contracts
    const { data: contractData } = await supabase
      .from('installment_contracts')
      .select('*')
      .limit(1);
      
    if (contractData && contractData.length > 0) {
      console.log('installment_contracts columns:', Object.keys(contractData[0]).join(', '));
    } else {
      console.log('installment_contracts: ตารางว่าง');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

discoverActualStructure();