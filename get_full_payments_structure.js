import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function getFullPaymentsStructure() {
  console.log('🔍 ดึงโครงสร้างเต็มของตาราง installment_payments');
  console.log('================================================================');

  try {
    // ใส่ข้อมูลครบตามที่รู้
    const fullData = {
      payment_number: 1,
      amount_due: 5000,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      late_fee: 0,
      discount: 0
    };

    console.log('ลองใส่ข้อมูลครบ...');
    const { data, error } = await supabase
      .from('installment_payments')
      .insert(fullData)
      .select();

    if (error) {
      console.log('❌ Error:', error.message);
      
      // ถ้ายังมี NOT NULL constraint
      if (error.message.includes('null value in column')) {
        const match = error.message.match(/null value in column "([^"]+)"/);
        if (match) {
          const missingColumn = match[1];
          console.log(`⚠️  ยังขาดคอลัมน์: ${missingColumn}`);
          
          // ลองเดาค่าที่เหมาะสม
          let additionalValue;
          if (missingColumn.includes('id')) {
            additionalValue = '00000000-0000-0000-0000-000000000001';
          } else if (missingColumn.includes('date')) {
            additionalValue = new Date().toISOString().split('T')[0];
          } else if (missingColumn.includes('amount')) {
            additionalValue = 0;
          } else {
            additionalValue = 'default';
          }
          
          const completeData = {
            ...fullData,
            [missingColumn]: additionalValue
          };
          
          console.log(`ลองใส่ ${missingColumn}: ${additionalValue}`);
          const { data: completeResult, error: completeError } = await supabase
            .from('installment_payments')
            .insert(completeData)
            .select();
            
          if (completeError) {
            console.log(`❌ ยังมี error: ${completeError.message}`);
          } else {
            console.log('✅ Insert สำเร็จ!');
            if (completeResult && completeResult[0]) {
              console.log('\n📊 โครงสร้างตารางเต็ม:');
              Object.keys(completeResult[0]).forEach(col => {
                const value = completeResult[0][col];
                const type = typeof value;
                console.log(`   - ${col}: ${type} = ${value}`);
              });
              
              // ลบข้อมูลทดสอบ
              await supabase
                .from('installment_payments')
                .delete()
                .eq('id', completeResult[0].id);
              console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
            }
          }
        }
      }
    } else {
      console.log('✅ Insert สำเร็จ!');
      if (data && data[0]) {
        console.log('\n📊 โครงสร้างตารางเต็ม:');
        Object.keys(data[0]).forEach(col => {
          const value = data[0][col];
          const type = typeof value;
          console.log(`   - ${col}: ${type} = ${value}`);
        });
        
        // ลบข้อมูลทดสอบ
        await supabase
          .from('installment_payments')
          .delete()
          .eq('id', data[0].id);
        console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
      }
    }

    // สร้างสรุป mapping ชื่อคอลัมน์
    console.log('\n📋 สรุป Column Mapping:');
    console.log('================================================================');
    console.log('ชื่อที่คาดหวัง -> ชื่อจริงในฐานข้อมูล');
    console.log('installment_number -> payment_number');
    console.log('amount -> amount_due');
    console.log('contract_id -> ??? (ต้องหาต่อ)');
    
    // ลองหา contract reference column
    console.log('\n🔍 หา contract reference column:');
    const possibleContractCols = [
      'installment_contract_id',
      'contract_id',
      'sale_id',
      'transaction_id',
      'installment_id'
    ];
    
    for (const colName of possibleContractCols) {
      try {
        const testData = {
          ...fullData,
          [colName]: '00000000-0000-0000-0000-000000000001'
        };
        
        const { error: testError } = await supabase
          .from('installment_payments')
          .insert(testData);
          
        if (testError) {
          if (testError.message.includes(`Could not find the '${colName}' column`)) {
            console.log(`❌ ${colName}: ไม่มีอยู่`);
          } else {
            console.log(`🔍 ${colName}: ${testError.message}`);
          }
        } else {
          console.log(`✅ ${colName}: มีอยู่!`);
          // ลบข้อมูลทดสอบทันที
          const { data: insertedData } = await supabase
            .from('installment_payments')
            .select('id')
            .eq(colName, '00000000-0000-0000-0000-000000000001')
            .single();
          if (insertedData) {
            await supabase
              .from('installment_payments')
              .delete()
              .eq('id', insertedData.id);
          }
        }
      } catch (err) {
        console.log(`🔍 ${colName}: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

getFullPaymentsStructure();