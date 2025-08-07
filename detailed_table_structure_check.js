import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function checkDetailedTableStructure() {
  console.log('🔍 ตรวจสอบโครงสร้างตารางแบบละเอียด');
  console.log('================================================================');

  const tablesToCheck = [
    'customers',
    'guarantors', 
    'installment_contracts',
    'installment_payments',
    'contract_documents'
  ];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 ตาราง: ${tableName}`);
      console.log('----------------------------------------');

      // ลองสร้างข้อมูลทดสอบเพื่อดูว่าคอลัมน์ไหนขาดหาย
      let testData = {};
      
      // กำหนดข้อมูลทดสอบตามตาราง
      switch (tableName) {
        case 'customers':
          testData = {
            name: 'Test Customer',
            phone: '081-234-5678',
            email: 'test@example.com',
            address: 'Test Address',
            id_card: '1-2345-67890-12-3',
            occupation: 'Test Job',
            monthly_income: 30000
          };
          break;
          
        case 'guarantors':
          // ต้องมี branch_id ที่ถูกต้อง
          const { data: branches } = await supabase.from('branches').select('id').limit(1);
          const branchId = branches?.[0]?.id || '00000000-0000-0000-0000-000000000000';
          
          testData = {
            name: 'Test Guarantor',
            phone: '081-234-5678',
            email: 'guarantor@example.com',
            address: 'Test Address',
            id_card: '1-2345-67890-12-4',
            occupation: 'Test Job',
            monthly_income: 40000,
            emergency_contact_name: 'Emergency Contact',
            emergency_contact_phone: '081-999-9999',
            emergency_contact_relationship: 'พี่น้อง',
            created_by: 'test-user',
            branch_id: branchId
          };
          break;
          
        case 'installment_contracts':
          testData = {
            contract_number: 'TEST-001',
            customer_id: '00000000-0000-0000-0000-000000000001',
            plan_id: '00000000-0000-0000-0000-000000000002',
            total_amount: 50000,
            down_payment: 5000,
            financed_amount: 45000,
            monthly_payment: 4000,
            status: 'draft'
          };
          break;
          
        case 'installment_payments':
          testData = {
            contract_id: '00000000-0000-0000-0000-000000000001',
            installment_number: 1,
            due_date: new Date().toISOString(),
            amount: 4000,
            principal_amount: 3500,
            interest_amount: 500,
            status: 'pending'
          };
          break;
          
        case 'contract_documents':
          testData = {
            contract_id: '00000000-0000-0000-0000-000000000001',
            document_type: 'id_card',
            file_name: 'test.pdf',
            file_path: '/test/path',
            uploaded_by: 'test-user'
          };
          break;
      }

      // ลอง insert ข้อมูลทดสอบ
      const { data, error } = await supabase
        .from(tableName)
        .insert(testData)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        
        // วิเคราะห์ error เพื่อหาคอลัมน์ที่ขาดหาย
        if (error.message.includes('Could not find')) {
          const match = error.message.match(/Could not find the '([^']+)' column/);
          if (match) {
            console.log(`⚠️  คอลัมน์ที่ขาดหาย: ${match[1]}`);
          }
        } else if (error.message.includes('null value in column')) {
          const match = error.message.match(/null value in column "([^"]+)"/);
          if (match) {
            console.log(`⚠️  คอลัมน์ที่ต้องมีค่า (NOT NULL): ${match[1]}`);
          }
        } else if (error.message.includes('violates foreign key constraint')) {
          console.log(`⚠️  ปัญหา Foreign Key - ต้องมีข้อมูลในตารางที่เชื่อมโยง`);
        } else {
          console.log(`⚠️  ปัญหาอื่นๆ: ${error.code}`);
        }
      } else {
        console.log(`✅ สามารถ insert ข้อมูลได้ - โครงสร้างถูกต้อง`);
        
        // ลบข้อมูลทดสอบ
        if (data && data[0]) {
          await supabase.from(tableName).delete().eq('id', data[0].id);
          console.log(`🗑️  ลบข้อมูลทดสอบแล้ว`);
        }
      }

      // ลองดึงข้อมูลเพื่อดูโครงสร้าง
      const { data: sampleData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!selectError && sampleData && sampleData.length > 0) {
        const columns = Object.keys(sampleData[0]);
        console.log(`📊 คอลัมน์ที่มีอยู่: ${columns.join(', ')}`);
      }

    } catch (err) {
      console.log(`❌ Error checking ${tableName}:`, err.message);
    }
  }

  // ตรวจสอบข้อมูลใน installment_plans
  console.log(`\n📋 ตรวจสอบข้อมูลใน installment_plans`);
  console.log('----------------------------------------');
  
  try {
    const { data: plans, error } = await supabase
      .from('installment_plans')
      .select('plan_number, name, months, number_of_installments, requires_guarantor, is_active')
      .order('plan_number');

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ พบแผนผ่อนชำระ ${plans.length} แผน:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.plan_number}: ${plan.name} (${plan.number_of_installments} งวด, ต้องผู้ค้ำ: ${plan.requires_guarantor ? 'ใช่' : 'ไม่'})`);
      });
    }
  } catch (err) {
    console.log(`❌ Error checking installment_plans:`, err.message);
  }

  console.log('\n🎯 สรุป: ตรวจสอบเสร็จสิ้น');
}

checkDetailedTableStructure();