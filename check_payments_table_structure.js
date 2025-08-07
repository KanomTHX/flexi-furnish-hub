import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function checkPaymentsTableStructure() {
  console.log('🔍 ตรวจสอบโครงสร้างตาราง installment_payments');
  console.log('================================================================');

  try {
    // ลองดึงข้อมูลเพื่อดูโครงสร้าง
    const { data, error } = await supabase
      .from('installment_payments')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ ตารางมีข้อมูล - คอลัมน์ที่มีอยู่:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]} (value: ${data[0][col]})`);
      });
    } else {
      console.log('📊 ตารางว่าง - ลองใส่ข้อมูลทดสอบเพื่อดูโครงสร้าง...');
      
      // ลองใส่ข้อมูลทดสอบเพื่อดูว่าคอลัมน์ไหนขาดหาย
      const testData = {
        contract_id: '00000000-0000-0000-0000-000000000001',
        installment_number: 1,
        due_date: new Date().toISOString().split('T')[0],
        amount: 5000,
        principal_amount: 4500,
        interest_amount: 500,
        status: 'pending'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('installment_payments')
        .insert(testData)
        .select();

      if (insertError) {
        console.log('❌ Insert Error:', insertError.message);
        
        // วิเคราะห์ error
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const match = insertError.message.match(/column "([^"]+)" does not exist/);
          if (match) {
            console.log(`⚠️  คอลัมน์ที่ไม่มีอยู่: ${match[1]}`);
          }
        }
      } else {
        console.log('✅ Insert สำเร็จ - คอลัมน์ที่มีอยู่:');
        if (insertData && insertData[0]) {
          const columns = Object.keys(insertData[0]);
          columns.forEach(col => {
            console.log(`   - ${col}: ${typeof insertData[0][col]}`);
          });
          
          // ลบข้อมูลทดสอบ
          await supabase
            .from('installment_payments')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
        }
      }
    }

    // ตรวจสอบคอลัมน์ที่คาดว่าจะมี
    console.log('\n📋 ตรวจสอบคอลัมน์ที่จำเป็น:');
    const requiredColumns = [
      'id',
      'contract_id', // อาจจะเป็น installment_contract_id
      'installment_number',
      'due_date',
      'amount',
      'principal_amount',
      'interest_amount',
      'status',
      'paid_date',
      'paid_amount',
      'payment_method',
      'receipt_number',
      'late_fee',
      'discount',
      'notes',
      'processed_by',
      'created_at',
      'updated_at',
      'branch_id'
    ];

    for (const column of requiredColumns) {
      try {
        const testData = { [column]: null };
        const { error } = await supabase
          .from('installment_payments')
          .insert(testData);

        if (error && error.message.includes(`Could not find the '${column}' column`)) {
          console.log(`❌ ${column}: ไม่มีอยู่`);
        } else if (error && error.message.includes(`column "${column}" does not exist`)) {
          console.log(`❌ ${column}: ไม่มีอยู่`);
        } else {
          console.log(`✅ ${column}: มีอยู่`);
        }
      } catch (err) {
        console.log(`🔍 ${column}: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPaymentsTableStructure();