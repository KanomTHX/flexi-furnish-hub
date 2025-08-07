// ===================================================================
// TABLE STRUCTURE CHECKER
// ตรวจสอบโครงสร้างตารางแบบละเอียด
// ===================================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * ดึงโครงสร้างตารางโดยการ describe table
 */
async function describeTable(tableName) {
  try {
    console.log(`\n🔍 ตรวจสอบโครงสร้างตาราง: ${tableName}`);
    
    // ลองดึงข้อมูล 1 แถวเพื่อดูโครงสร้าง
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ไม่สามารถเข้าถึงตาราง: ${error.message}`);
      return null;
    }

    if (data && data.length > 0) {
      console.log(`✅ พบข้อมูล ${data.length} แถว`);
      console.log('📊 โครงสร้างคอลัมน์:');
      
      const sample = data[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${key}: ${type} = ${JSON.stringify(value)}`);
      });
      
      return Object.keys(sample);
    } else {
      console.log('📊 ตารางว่าง - ลองสร้างข้อมูลทดสอบ...');
      
      // ลอง insert ข้อมูลเปล่าเพื่อดู required fields
      try {
        await supabase.from(tableName).insert({});
      } catch (insertError) {
        console.log('💡 ข้อมูลจาก insert error:');
        console.log(insertError.message);
        
        // Parse error เพื่อหา required columns
        if (insertError.message.includes('null value in column')) {
          const matches = insertError.message.match(/null value in column "([^"]+)"/g);
          if (matches) {
            console.log('🔑 คอลัมน์ที่จำเป็น:');
            matches.forEach(match => {
              const column = match.match(/"([^"]+)"/)[1];
              console.log(`  - ${column} (required)`);
            });
          }
        }
      }
      
      return [];
    }
  } catch (error) {
    console.error(`❌ Error describing ${tableName}:`, error.message);
    return null;
  }
}

/**
 * ตรวจสอบตารางที่สำคัญ
 */
async function checkImportantTables() {
  const tables = [
    'customers',
    'installment_plans', 
    'installment_contracts',
    'installment_payments'
  ];

  const results = {};

  for (const table of tables) {
    const columns = await describeTable(table);
    results[table] = columns;
    
    // รอสักครู่ระหว่างการตรวจสอบ
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * ตรวจสอบความสัมพันธ์ระหว่างตาราง
 */
async function checkRelationships() {
  console.log('\n🔗 ตรวจสอบความสัมพันธ์ระหว่างตาราง...');
  
  // ตรวจสอบ installment_contracts
  try {
    const { data, error } = await supabase
      .from('installment_contracts')
      .select('*')
      .limit(1);

    if (!error && data) {
      console.log('\n📄 installment_contracts structure:');
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          if (key.includes('customer') || key.includes('id')) {
            console.log(`  🔑 ${key}: ${JSON.stringify(data[0][key])}`);
          }
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking installment_contracts:', error.message);
  }

  // ตรวจสอบ customers
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (!error && data) {
      console.log('\n👤 customers structure:');
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          console.log(`  📝 ${key}: ${JSON.stringify(data[0][key])}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking customers:', error.message);
  }
}

/**
 * สร้าง migration script ที่ถูกต้อง
 */
function generateCorrectMigration(results) {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 สร้าง Migration Script ที่ถูกต้อง');
  console.log('='.repeat(60));

  let migrationSQL = `-- ===================================================================
-- CORRECTED SUPABASE MIGRATION
-- ===================================================================

BEGIN;

`;

  // เพิ่มคอลัมน์ในตาราง customers
  if (results.customers) {
    migrationSQL += `-- เพิ่มคอลัมน์ใหม่ในตาราง customers
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

-- เพิ่ม unique constraint
ALTER TABLE customers 
ADD CONSTRAINT customers_id_card_unique UNIQUE (id_card);

`;
  }

  // เพิ่มคอลัมน์ในตาราง installment_contracts
  if (results.installment_contracts) {
    migrationSQL += `-- เพิ่มคอลัมน์ใหม่ในตาราง installment_contracts
ALTER TABLE installment_contracts 
ADD COLUMN IF NOT EXISTS guarantor_id UUID,
ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS collateral TEXT,
ADD COLUMN IF NOT EXISTS terms TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS branch_id UUID;

`;
  }

  // สร้างตาราง guarantors
  migrationSQL += `-- สร้างตาราง guarantors
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

-- สร้างตาราง contract_history
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

-- สร้างตาราง contract_documents
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

-- เพิ่ม foreign key constraints
ALTER TABLE installment_contracts 
ADD CONSTRAINT fk_contracts_guarantor 
FOREIGN KEY (guarantor_id) REFERENCES guarantors(id);

ALTER TABLE contract_history 
ADD CONSTRAINT fk_history_contract 
FOREIGN KEY (contract_id) REFERENCES installment_contracts(id) ON DELETE CASCADE;

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_customers_id_card ON customers(id_card);
CREATE INDEX IF NOT EXISTS idx_guarantors_id_card ON guarantors(id_card);
CREATE INDEX IF NOT EXISTS idx_contracts_guarantor_id ON installment_contracts(guarantor_id);
CREATE INDEX IF NOT EXISTS idx_history_contract_id ON contract_history(contract_id);

COMMIT;
`;

  // บันทึกไฟล์
  fs.writeFileSync('corrected_migration.sql', migrationSQL);
  console.log('💾 สร้างไฟล์: corrected_migration.sql');
  
  return migrationSQL;
}

// Main execution
async function main() {
  console.log('🚀 ตรวจสอบโครงสร้างตารางแบบละเอียด...');
  
  try {
    const results = await checkImportantTables();
    await checkRelationships();
    generateCorrectMigration(results);
    
    console.log('\n✅ ตรวจสอบเสร็จสิ้น');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

main();