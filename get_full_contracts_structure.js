import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function getFullContractsStructure() {
  console.log('🔍 ดึงโครงสร้างเต็มของตาราง installment_contracts');
  console.log('================================================================');

  let currentData = {
    status: 'pending',
    contract_number: 'TEST-001'
  };

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nAttempt ${attempts}: ลองใส่ข้อมูล...`);
    
    try {
      const { data, error } = await supabase
        .from('installment_contracts')
        .insert(currentData)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        
        // ถ้า error เกี่ยวกับ NOT NULL constraint
        if (error.message.includes('null value in column')) {
          const match = error.message.match(/null value in column "([^"]+)"/);
          if (match) {
            const missingColumn = match[1];
            console.log(`⚠️  ต้องเพิ่มคอลัมน์: ${missingColumn}`);
            
            // เดาค่าที่เหมาะสม
            let value;
            if (missingColumn.includes('id')) {
              value = '00000000-0000-0000-0000-000000000001';
            } else if (missingColumn.includes('amount')) {
              value = 50000;
            } else if (missingColumn.includes('date')) {
              value = new Date().toISOString().split('T')[0];
            } else if (missingColumn.includes('number')) {
              value = 1;
            } else {
              value = 'default-value';
            }
            
            currentData[missingColumn] = value;
            console.log(`   เพิ่ม ${missingColumn}: ${value}`);
            continue; // ลองใหม่
          }
        } else if (error.message.includes('violates foreign key constraint')) {
          console.log('⚠️  Foreign key constraint - ต้องมีข้อมูลในตารางที่เชื่อมโยง');
          break;
        } else {
          console.log('⚠️  Error อื่นๆ - หยุดการทดสอบ');
          break;
        }
      } else {
        console.log('✅ Insert สำเร็จ!');
        if (data && data[0]) {
          console.log('\n📊 โครงสร้างตารางเต็ม installment_contracts:');
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
        break; // สำเร็จแล้ว
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      break;
    }
  }

  if (attempts >= maxAttempts) {
    console.log('⚠️  ถึงจำนวนครั้งสูงสุดแล้ว');
  }

  // สรุปข้อมูลที่ได้
  console.log('\n📋 สรุปข้อมูลที่ได้:');
  console.log('================================================================');
  console.log('คอลัมน์ที่ต้องมีค่า (NOT NULL):');
  Object.keys(currentData).forEach(key => {
    console.log(`   - ${key}: ${currentData[key]}`);
  });
}

getFullContractsStructure();