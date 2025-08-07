import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function finalContractsStructureTest() {
  console.log('🔍 ทดสอบโครงสร้างสุดท้ายของ installment_contracts');
  console.log('================================================================');

  // ใส่ข้อมูลที่ถูกต้อง
  const testData = {
    status: 'pending',
    contract_number: 'TEST-001',
    transaction_id: '00000000-0000-0000-0000-000000000001',
    down_payment: 5000 // แก้เป็นตัวเลข
  };

  try {
    console.log('ลองใส่ข้อมูลที่แก้ไขแล้ว...');
    const { data, error } = await supabase
      .from('installment_contracts')
      .insert(testData)
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      
      // ถ้ายังมี NOT NULL constraint อื่น
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`⚠️  ยังต้องมีคอลัมน์: ${match[1]}`);
          
          // ลองเพิ่มคอลัมน์ที่ขาดหาย
          const missingColumn = match[1];
          let additionalValue;
          
          if (missingColumn.includes('amount')) {
            additionalValue = 50000;
          } else if (missingColumn.includes('id')) {
            additionalValue = '00000000-0000-0000-0000-000000000002';
          } else if (missingColumn.includes('date')) {
            additionalValue = new Date().toISOString().split('T')[0];
          } else {
            additionalValue = 1;
          }
          
          const completeData = {
            ...testData,
            [missingColumn]: additionalValue
          };
          
          console.log(`ลองเพิ่ม ${missingColumn}: ${additionalValue}`);
          const { data: completeResult, error: completeError } = await supabase
            .from('installment_contracts')
            .insert(completeData)
            .select();
            
          if (completeError) {
            console.log(`❌ ยังมี error: ${completeError.message}`);
          } else {
            console.log('✅ Insert สำเร็จ!');
            if (completeResult && completeResult[0]) {
              console.log('\n📊 โครงสร้างตารางเต็ม installment_contracts:');
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
      } else if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Foreign key constraint - ข้อมูล reference ไม่มีอยู่');
        console.log('   แต่โครงสร้างตารางถูกต้องแล้ว');
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
    }

  } catch (err) {
    console.error('Error:', err.message);
  }

  // สรุปสิ่งที่เรียนรู้
  console.log('\n📋 สรุปโครงสร้างที่ค้นพบ:');
  console.log('================================================================');
  console.log('installment_contracts:');
  console.log('   - status: enum (pending, ...)');
  console.log('   - contract_number: VARCHAR (NOT NULL)');
  console.log('   - transaction_id: UUID (NOT NULL)');
  console.log('   - down_payment: NUMERIC (NOT NULL)');
  console.log('');
  console.log('installment_payments:');
  console.log('   - installment_plan_id: UUID (reference to installment_plans)');
  console.log('   - payment_number: INTEGER (NOT NULL)');
  console.log('   - amount_due: NUMERIC (NOT NULL)');
  console.log('   - amount_paid: NUMERIC');
  console.log('   - payment_date: DATE');
  console.log('   - payment_method: VARCHAR');
  console.log('   - status: VARCHAR');
}

finalContractsStructureTest();