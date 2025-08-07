import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hartshwcchbsnmbrjdyn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw'
);

async function addMissingColumnsStepByStep() {
  console.log('🔧 เพิ่มคอลัมน์ที่ขาดหายทีละขั้นตอน');
  console.log('================================================================');

  // ขั้นตอนที่ 1: เพิ่มคอลัมน์ที่จำเป็นใน installment_contracts
  console.log('\n📋 1. เพิ่มคอลัมน์ใน installment_contracts');
  console.log('----------------------------------------');
  
  const contractColumns = [
    { name: 'customer_id', type: 'UUID' },
    { name: 'plan_id', type: 'UUID' },
    { name: 'guarantor_id', type: 'UUID' },
    { name: 'contract_number', type: 'VARCHAR(50)' },
    { name: 'financed_amount', type: 'DECIMAL(12,2)' },
    { name: 'monthly_payment', type: 'DECIMAL(12,2)' },
    { name: 'total_interest', type: 'DECIMAL(12,2) DEFAULT 0' },
    { name: 'processing_fee', type: 'DECIMAL(12,2) DEFAULT 0' },
    { name: 'total_payable', type: 'DECIMAL(12,2)' },
    { name: 'contract_date', type: 'DATE DEFAULT CURRENT_DATE' },
    { name: 'first_payment_date', type: 'DATE' },
    { name: 'last_payment_date', type: 'DATE' },
    { name: 'paid_installments', type: 'INTEGER DEFAULT 0' },
    { name: 'remaining_installments', type: 'INTEGER' },
    { name: 'total_paid', type: 'DECIMAL(12,2) DEFAULT 0' },
    { name: 'remaining_balance', type: 'DECIMAL(12,2)' },
    { name: 'collateral', type: 'TEXT' },
    { name: 'terms', type: 'TEXT' },
    { name: 'notes', type: 'TEXT' },
    { name: 'created_by', type: 'VARCHAR(255)' }, // ใช้ VARCHAR แทน UUID เพื่อหลีกเลี่ยงปัญหา
    { name: 'approved_by', type: 'VARCHAR(255)' },
    { name: 'approved_at', type: 'TIMESTAMP WITH TIME ZONE' }
  ];

  for (const column of contractColumns) {
    try {
      // ลองเพิ่มคอลัมน์ผ่านการ insert ข้อมูลทดสอบ
      const testData = { [column.name]: null };
      const { error } = await supabase
        .from('installment_contracts')
        .insert(testData);

      if (error && error.message.includes(`Could not find the '${column.name}' column`)) {
        console.log(`⚠️  คอลัมน์ ${column.name} ไม่มีอยู่ - ต้องเพิ่มผ่าน SQL Editor`);
      } else {
        console.log(`✅ คอลัมน์ ${column.name} มีอยู่แล้ว`);
      }
    } catch (err) {
      console.log(`🔍 ตรวจสอบ ${column.name}: ${err.message}`);
    }
  }

  // ขั้นตอนที่ 2: เพิ่มคอลัมน์ใน installment_payments
  console.log('\n📋 2. เพิ่มคอลัมน์ใน installment_payments');
  console.log('----------------------------------------');
  
  const paymentColumns = [
    { name: 'amount', type: 'DECIMAL(12,2) NOT NULL DEFAULT 0' },
    { name: 'paid_date', type: 'DATE' },
    { name: 'paid_amount', type: 'DECIMAL(12,2)' },
    { name: 'payment_method', type: 'VARCHAR(50)' },
    { name: 'receipt_number', type: 'VARCHAR(100)' },
    { name: 'late_fee', type: 'DECIMAL(12,2) DEFAULT 0' },
    { name: 'discount', type: 'DECIMAL(12,2) DEFAULT 0' },
    { name: 'notes', type: 'TEXT' },
    { name: 'processed_by', type: 'VARCHAR(255)' }
  ];

  for (const column of paymentColumns) {
    try {
      const testData = { [column.name]: null };
      const { error } = await supabase
        .from('installment_payments')
        .insert(testData);

      if (error && error.message.includes(`Could not find the '${column.name}' column`)) {
        console.log(`⚠️  คอลัมน์ ${column.name} ไม่มีอยู่ - ต้องเพิ่มผ่าน SQL Editor`);
      } else {
        console.log(`✅ คอลัมน์ ${column.name} มีอยู่แล้ว`);
      }
    } catch (err) {
      console.log(`🔍 ตรวจสอบ ${column.name}: ${err.message}`);
    }
  }

  // ขั้นตอนที่ 3: เพิ่มคอลัมน์ใน guarantors
  console.log('\n📋 3. เพิ่มคอลัมน์ใน guarantors');
  console.log('----------------------------------------');
  
  const guarantorColumns = [
    { name: 'workplace', type: 'VARCHAR(255)' },
    { name: 'work_address', type: 'TEXT' },
    { name: 'created_by', type: 'VARCHAR(255)' },
    { name: 'updated_by', type: 'VARCHAR(255)' }
  ];

  for (const column of guarantorColumns) {
    try {
      const testData = { [column.name]: null };
      const { error } = await supabase
        .from('guarantors')
        .insert(testData);

      if (error && error.message.includes(`Could not find the '${column.name}' column`)) {
        console.log(`⚠️  คอลัมน์ ${column.name} ไม่มีอยู่ - ต้องเพิ่มผ่าน SQL Editor`);
      } else {
        console.log(`✅ คอลัมน์ ${column.name} มีอยู่แล้ว`);
      }
    } catch (err) {
      console.log(`🔍 ตรวจสอบ ${column.name}: ${err.message}`);
    }
  }

  // ขั้นตอนที่ 4: เพิ่มคอลัมน์ใน contract_documents
  console.log('\n📋 4. เพิ่มคอลัมน์ใน contract_documents');
  console.log('----------------------------------------');
  
  const documentColumns = [
    { name: 'file_size', type: 'BIGINT' },
    { name: 'mime_type', type: 'VARCHAR(100)' },
    { name: 'description', type: 'TEXT' },
    { name: 'uploaded_by', type: 'VARCHAR(255)' }
  ];

  for (const column of documentColumns) {
    try {
      const testData = { [column.name]: null };
      const { error } = await supabase
        .from('contract_documents')
        .insert(testData);

      if (error && error.message.includes(`Could not find the '${column.name}' column`)) {
        console.log(`⚠️  คอลัมน์ ${column.name} ไม่มีอยู่ - ต้องเพิ่มผ่าน SQL Editor`);
      } else {
        console.log(`✅ คอลัมน์ ${column.name} มีอยู่แล้ว`);
      }
    } catch (err) {
      console.log(`🔍 ตรวจสอบ ${column.name}: ${err.message}`);
    }
  }

  // สร้างสรุป SQL commands ที่ต้องรันใน SQL Editor
  console.log('\n📝 สรุป SQL Commands ที่ต้องรันใน Supabase SQL Editor');
  console.log('================================================================');
  
  const sqlCommands = [
    '-- เพิ่มคอลัมน์ใน installment_contracts',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS customer_id UUID;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS plan_id UUID;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS guarantor_id UUID;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS contract_number VARCHAR(50);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS financed_amount DECIMAL(12,2);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(12,2);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_interest DECIMAL(12,2) DEFAULT 0;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(12,2) DEFAULT 0;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_payable DECIMAL(12,2);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS contract_date DATE DEFAULT CURRENT_DATE;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS first_payment_date DATE;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS last_payment_date DATE;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS remaining_installments INTEGER;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12,2) DEFAULT 0;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS collateral TEXT;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS terms TEXT;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS notes TEXT;',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);',
    'ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;',
    '',
    '-- เพิ่มคอลัมน์ใน installment_payments',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2) NOT NULL DEFAULT 0;',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS paid_date DATE;',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2);',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS late_fee DECIMAL(12,2) DEFAULT 0;',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0;',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS notes TEXT;',
    'ALTER TABLE installment_payments ADD COLUMN IF NOT EXISTS processed_by VARCHAR(255);',
    '',
    '-- เพิ่มคอลัมน์ใน guarantors',
    'ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS workplace VARCHAR(255);',
    'ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS work_address TEXT;',
    'ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);',
    'ALTER TABLE guarantors ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);',
    '',
    '-- เพิ่มคอลัมน์ใน contract_documents',
    'ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;',
    'ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);',
    'ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS description TEXT;',
    'ALTER TABLE contract_documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255);',
    '',
    '-- สร้างตารางใหม่',
    'CREATE TABLE IF NOT EXISTS contract_history (',
    '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
    '    contract_id UUID,',
    '    action VARCHAR(50) NOT NULL,',
    '    old_values JSONB,',
    '    new_values JSONB,',
    '    description TEXT,',
    '    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),',
    '    created_by VARCHAR(255)',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS installment_notifications (',
    '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
    '    type VARCHAR(50) NOT NULL,',
    '    title VARCHAR(255) NOT NULL,',
    '    message TEXT NOT NULL,',
    '    contract_id UUID,',
    '    customer_id UUID,',
    '    priority VARCHAR(20) DEFAULT \'medium\',',
    '    status VARCHAR(20) DEFAULT \'unread\',',
    '    due_date DATE,',
    '    amount DECIMAL(12,2),',
    '    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    ');'
  ];

  console.log(sqlCommands.join('\n'));

  console.log('\n🎯 ขั้นตอนต่อไป:');
  console.log('1. คัดลอก SQL commands ข้างต้น');
  console.log('2. ไปที่ Supabase Dashboard > SQL Editor');
  console.log('3. วาง SQL commands และรัน');
  console.log('4. กลับมาตรวจสอบผลลัพธ์');
}

addMissingColumnsStepByStep();