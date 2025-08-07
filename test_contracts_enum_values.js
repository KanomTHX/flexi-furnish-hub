import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function testContractsEnumValues() {
  console.log('🔍 ทดสอบค่า enum ที่ถูกต้องสำหรับ installment_contracts');
  console.log('================================================================');

  // ลองค่า status ที่เป็นไปได้
  const possibleStatuses = [
    'active',
    'pending',
    'completed',
    'cancelled',
    'approved',
    'rejected',
    'processing',
    'paid',
    'unpaid',
    'overdue'
  ];

  for (const status of possibleStatuses) {
    try {
      console.log(`\nลองใส่ status: "${status}"`);
      
      const { data, error } = await supabase
        .from('installment_contracts')
        .insert({ status: status })
        .select();

      if (error) {
        if (error.message.includes('invalid input value for enum')) {
          console.log(`❌ "${status}": ไม่ใช่ค่าที่ถูกต้อง`);
        } else {
          console.log(`🔍 "${status}": ${error.message}`);
          
          // ถ้า error เกี่ยวกับ NOT NULL constraint แสดงว่า status ถูกต้อง
          if (error.message.includes('null value in column')) {
            console.log(`✅ "${status}": เป็นค่าที่ถูกต้อง!`);
            const match = error.message.match(/null value in column "([^"]+)"/);
            if (match) {
              console.log(`   ต้องมีคอลัมน์: ${match[1]}`);
            }
            break; // หยุดเมื่อเจอค่าที่ถูกต้อง
          }
        }
      } else {
        console.log(`✅ "${status}": Insert สำเร็จ!`);
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
        break; // หยุดเมื่อ insert สำเร็จ
      }
    } catch (err) {
      console.log(`❌ "${status}": ${err.message}`);
    }
  }

  // ถ้าไม่เจอค่าที่ถูกต้อง ลองไม่ใส่ status
  console.log('\n🔍 ลองไม่ใส่ status (ใช้ default value):');
  try {
    const { data, error } = await supabase
      .from('installment_contracts')
      .insert({})
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`⚠️  คอลัมน์ที่ต้องมีค่า: ${match[1]}`);
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
    console.log(`❌ Error: ${err.message}`);
  }
}

testContractsEnumValues();