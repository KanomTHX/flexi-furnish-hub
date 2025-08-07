// ===================================================================
// CREATE TABLES DIRECTLY
// สร้างตารางโดยตรงผ่าน Supabase
// ===================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * สร้างตาราง guarantors โดยการ insert ข้อมูลทดสอบ
 */
async function createGuarantorsTable() {
  console.log('\n🔧 สร้างตาราง guarantors...');
  
  try {
    // ลองสร้างข้อมูลทดสอบเพื่อให้ Supabase สร้างตาราง
    const { data, error } = await supabase
      .from('guarantors')
      .insert([{
        name: 'ทดสอบ ผู้ค้ำประกัน',
        phone: '081-234-5678',
        email: 'test@example.com',
        address: '123 ถนนทดสอบ',
        id_card: '1-2345-67890-12-3',
        occupation: 'พนักงานบริษัท',
        monthly_income: 30000,
        workplace: 'บริษัททดสอบ',
        work_address: '456 ถนนทำงาน'
      }])
      .select();

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('  ❌ ตาราง guarantors ยังไม่มีอยู่ - ต้องสร้างผ่าน SQL Editor');
        return false;
      } else {
        console.log('  ⚠️  Error:', error.message);
        return false;
      }
    }

    console.log('  ✅ ตาราง guarantors พร้อมใช้งาน');
    
    // ลบข้อมูลทดสอบ
    if (data && data.length > 0) {
      await supabase.from('guarantors').delete().eq('id', data[0].id);
      console.log('  🗑️  ลบข้อมูลทดสอบแล้ว');
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง guarantors:', error.message);
    return false;
  }
}

/**
 * สร้างตาราง contract_history
 */
async function createContractHistoryTable() {
  console.log('\n🔧 สร้างตาราง contract_history...');
  
  try {
    const { data, error } = await supabase
      .from('contract_history')
      .insert([{
        contract_id: '00000000-0000-0000-0000-000000000000',
        action: 'test',
        description: 'ทดสอบ',
        created_by: '00000000-0000-0000-0000-000000000000'
      }])
      .select();

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('  ❌ ตาราง contract_history ยังไม่มีอยู่');
        return false;
      } else {
        console.log('  ⚠️  Error:', error.message);
        return false;
      }
    }

    console.log('  ✅ ตาราง contract_history พร้อมใช้งาน');
    
    // ลบข้อมูลทดสอบ
    if (data && data.length > 0) {
      await supabase.from('contract_history').delete().eq('id', data[0].id);
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง contract_history:', error.message);
    return false;
  }
}

/**
 * สร้างตาราง contract_documents
 */
async function createContractDocumentsTable() {
  console.log('\n🔧 สร้างตาราง contract_documents...');
  
  try {
    const { data, error } = await supabase
      .from('contract_documents')
      .insert([{
        document_type: 'test',
        file_name: 'test.pdf',
        file_path: '/test/test.pdf',
        uploaded_by: '00000000-0000-0000-0000-000000000000'
      }])
      .select();

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('  ❌ ตาราง contract_documents ยังไม่มีอยู่');
        return false;
      } else {
        console.log('  ⚠️  Error:', error.message);
        return false;
      }
    }

    console.log('  ✅ ตาราง contract_documents พร้อมใช้งาน');
    
    // ลบข้อมูลทดสอบ
    if (data && data.length > 0) {
      await supabase.from('contract_documents').delete().eq('id', data[0].id);
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง contract_documents:', error.message);
    return false;
  }
}

/**
 * ตรวจสอบและเพิ่มคอลัมน์ในตาราง customers
 */
async function checkCustomersColumns() {
  console.log('\n🔧 ตรวจสอบคอลัมน์ในตาราง customers...');
  
  try {
    // ลองดึงข้อมูลเพื่อดูโครงสร้าง
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (error) {
      console.log('  ❌ ไม่สามารถเข้าถึงตาราง customers:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('  📊 คอลัมน์ที่มีอยู่:', columns.join(', '));
      
      const requiredColumns = [
        'id_card', 'occupation', 'monthly_income', 'workplace', 
        'work_address', 'emergency_contact_name', 'emergency_contact_phone', 
        'emergency_contact_relationship'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('  ❌ คอลัมน์ที่ขาดหาย:', missingColumns.join(', '));
        console.log('  💡 ต้องเพิ่มคอลัมน์ผ่าน SQL Editor');
        return false;
      } else {
        console.log('  ✅ คอลัมน์ครบถ้วนแล้ว');
        return true;
      }
    } else {
      console.log('  📊 ตารางว่าง - ไม่สามารถตรวจสอบโครงสร้างได้');
      return false;
    }
  } catch (error) {
    console.log('  ❌ ไม่สามารถตรวจสอบตาราง customers:', error.message);
    return false;
  }
}

/**
 * สร้าง SQL script สำหรับรันใน SQL Editor
 */
function generateSQLScript() {
  console.log('\n📝 สร้าง SQL Script สำหรับรันใน Supabase SQL Editor...');
  
  const sql = `-- ===================================================================
-- MANUAL MIGRATION SCRIPT
-- รันใน Supabase SQL Editor
-- ===================================================================

-- 1. สร้างตาราง guarantors
CREATE TABLE IF NOT EXISTS guarantors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    id_card VARCHAR(17) NOT NULL UNIQUE,
    occupation VARCHAR(255) NOT NULL,
    monthly_income DECIMAL(12,2) NOT NULL,
    workplace VARCHAR(255),
    work_address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    branch_id UUID
);

-- 2. สร้างตาราง contract_history
CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- 3. สร้างตาราง contract_documents
CREATE TABLE IF NOT EXISTS contract_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID,
    guarantor_id UUID,
    customer_id UUID,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL
);

-- 4. เพิ่มคอลัมน์ในตาราง customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id_card VARCHAR(17),
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS workplace VARCHAR(255),
ADD COLUMN IF NOT EXISTS work_address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS blacklisted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. เพิ่มคอลัมน์ในตาราง installment_contracts
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 6. เพิ่มคอลัมน์ในตาราง installment_payments
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS late_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processed_by UUID,
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 7. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_customers_id_card ON customers(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_history_contract_id ON contract_history(contract_id);

-- 8. เพิ่ม foreign key constraints (ถ้าต้องการ)
-- ALTER TABLE installment_contracts 
-- ADD CONSTRAINT fk_contracts_guarantor 
-- FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);

-- ALTER TABLE contract_history 
-- ADD CONSTRAINT fk_history_contract 
-- FOREIGN KEY (contract_id) REFERENCES installment_contracts(id) ON DELETE CASCADE;

-- เสร็จสิ้น
SELECT 'Migration completed successfully!' as result;`;

  // บันทึกไฟล์
  const fs = require('fs');
  fs.writeFileSync('manual_migration.sql', sql);
  console.log('💾 สร้างไฟล์: manual_migration.sql');
  
  return sql;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ตรวจสอบและสร้างตารางที่จำเป็น...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบตารางต่างๆ
    const guarantorsExists = await createGuarantorsTable();
    const historyExists = await createContractHistoryTable();
    const documentsExists = await createContractDocumentsTable();
    const customersOK = await checkCustomersColumns();

    // สรุปผลลัพธ์
    console.log('\n' + '='.repeat(50));
    console.log('📋 สรุปผลการตรวจสอบ');
    console.log('='.repeat(50));
    console.log(`guarantors: ${guarantorsExists ? '✅' : '❌'}`);
    console.log(`contract_history: ${historyExists ? '✅' : '❌'}`);
    console.log(`contract_documents: ${documentsExists ? '✅' : '❌'}`);
    console.log(`customers (columns): ${customersOK ? '✅' : '❌'}`);

    if (!guarantorsExists || !historyExists || !documentsExists || !customersOK) {
      console.log('\n🔧 ต้องรัน Migration ผ่าน SQL Editor');
      generateSQLScript();
      
      console.log('\n📋 วิธีการรัน Migration:');
      console.log('1. เปิด Supabase Dashboard');
      console.log('2. ไปที่ SQL Editor');
      console.log('3. คัดลอกเนื้อหาจากไฟล์ manual_migration.sql');
      console.log('4. รันใน SQL Editor');
      console.log('5. รัน npm run check-db เพื่อตรวจสอบผลลัพธ์');
    } else {
      console.log('\n✅ ตารางทั้งหมดพร้อมใช้งานแล้ว!');
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

// รันสคริปต์
main().then(() => {
  console.log('\n✅ เสร็จสิ้น');
  process.exit(0);
}).catch(error => {
  console.error('❌ เกิดข้อผิดพลาดในการรันสคริปต์:', error);
  process.exit(1);
});