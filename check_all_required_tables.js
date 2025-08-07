import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function checkAllRequiredTables() {
  console.log('🔍 ตรวจสอบตารางที่จำเป็นสำหรับระบบ Installment System');
  console.log('================================================================');

  // รายการตารางที่จำเป็นตามฟังก์ชันที่เขียนไว้
  const requiredTables = [
    {
      name: 'customers',
      description: 'ข้อมูลลูกค้า',
      requiredColumns: ['id', 'name', 'phone', 'email', 'address', 'id_card', 'occupation', 'monthly_income']
    },
    {
      name: 'guarantors', 
      description: 'ข้อมูลผู้ค้ำประกัน',
      requiredColumns: ['id', 'name', 'phone', 'email', 'address', 'id_card', 'occupation', 'monthly_income', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship', 'created_by', 'branch_id']
    },
    {
      name: 'installment_plans',
      description: 'แผนผ่อนชำระ',
      requiredColumns: ['id', 'plan_number', 'name', 'months', 'number_of_installments', 'interest_rate', 'down_payment', 'down_payment_percent', 'processing_fee', 'installment_amount', 'min_amount', 'max_amount', 'requires_guarantor', 'is_active', 'status', 'start_date', 'branch_id']
    },
    {
      name: 'installment_contracts',
      description: 'สัญญาผ่อนชำระ',
      requiredColumns: ['id', 'contract_number', 'customer_id', 'plan_id', 'guarantor_id', 'total_amount', 'down_payment', 'financed_amount', 'monthly_payment', 'status', 'created_by', 'branch_id']
    },
    {
      name: 'installment_payments',
      description: 'การชำระเงินงวด',
      requiredColumns: ['id', 'contract_id', 'installment_number', 'due_date', 'amount', 'principal_amount', 'interest_amount', 'status', 'branch_id']
    },
    {
      name: 'contract_documents',
      description: 'เอกสารแนบสัญญา',
      requiredColumns: ['id', 'contract_id', 'guarantor_id', 'customer_id', 'document_type', 'file_name', 'file_path', 'uploaded_by']
    },
    {
      name: 'branches',
      description: 'ข้อมูลสาขา (ใช้เป็น FK)',
      requiredColumns: ['id', 'name']
    }
  ];

  const results = {
    existingTables: [],
    missingTables: [],
    tablesWithMissingColumns: []
  };

  for (const table of requiredTables) {
    try {
      console.log(`\n📋 ตรวจสอบตาราง: ${table.name} (${table.description})`);
      
      // ตรวจสอบว่าตารางมีอยู่หรือไม่
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ตาราง ${table.name} ไม่มีอยู่`);
          results.missingTables.push(table);
          continue;
        } else {
          console.log(`⚠️  Error checking ${table.name}:`, error.message);
          continue;
        }
      }

      console.log(`✅ ตาราง ${table.name} มีอยู่`);
      results.existingTables.push(table.name);

      // ตรวจสอบคอลัมน์ที่จำเป็น
      if (data && data.length > 0) {
        const existingColumns = Object.keys(data[0]);
        const missingColumns = table.requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log(`⚠️  คอลัมน์ที่ขาดหาย: ${missingColumns.join(', ')}`);
          results.tablesWithMissingColumns.push({
            tableName: table.name,
            missingColumns: missingColumns,
            existingColumns: existingColumns
          });
        } else {
          console.log(`✅ คอลัมน์ครบถ้วน`);
        }
        
        console.log(`📊 คอลัมน์ที่มีอยู่: ${existingColumns.join(', ')}`);
      } else {
        console.log(`📊 ตารางว่าง - ไม่สามารถตรวจสอบคอลัมน์ได้`);
        
        // ลองใส่ข้อมูลทดสอบเพื่อดูคอลัมน์ที่จำเป็น
        try {
          const testData = {};
          table.requiredColumns.forEach(col => {
            testData[col] = col === 'id' ? 'test-id' : 'test-value';
          });
          
          const { error: insertError } = await supabase
            .from(table.name)
            .insert(testData);
            
          if (insertError) {
            console.log(`🔍 ข้อมูลจาก insert error: ${insertError.message}`);
          }
        } catch (testError) {
          console.log(`🔍 ไม่สามารถทดสอบ insert ได้`);
        }
      }

    } catch (err) {
      console.log(`❌ Error checking table ${table.name}:`, err.message);
    }
  }

  // สรุปผลการตรวจสอบ
  console.log('\n📊 สรุปผลการตรวจสอบ');
  console.log('================================================================');
  console.log(`✅ ตารางที่มีอยู่: ${results.existingTables.length}/${requiredTables.length}`);
  console.log(`❌ ตารางที่ขาดหาย: ${results.missingTables.length}`);
  console.log(`⚠️  ตารางที่ขาดคอลัมน์: ${results.tablesWithMissingColumns.length}`);

  if (results.missingTables.length > 0) {
    console.log('\n❌ ตารางที่ต้องสร้าง:');
    results.missingTables.forEach(table => {
      console.log(`   - ${table.name}: ${table.description}`);
    });
  }

  if (results.tablesWithMissingColumns.length > 0) {
    console.log('\n⚠️  ตารางที่ต้องเพิ่มคอลัมน์:');
    results.tablesWithMissingColumns.forEach(table => {
      console.log(`   - ${table.tableName}: ${table.missingColumns.join(', ')}`);
    });
  }

  if (results.missingTables.length === 0 && results.tablesWithMissingColumns.length === 0) {
    console.log('\n🎉 ระบบพร้อมใช้งาน! ตารางและคอลัมน์ครบถ้วนแล้ว');
  } else {
    console.log('\n🔧 ต้องแก้ไขฐานข้อมูลก่อนใช้งาน');
  }

  return results;
}

checkAllRequiredTables();