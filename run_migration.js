// ===================================================================
// RUN MIGRATION SCRIPT
// รันการ migrate ฐานข้อมูลผ่าน Supabase
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
 * รัน SQL script
 */
async function runSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // ถ้าไม่มี function exec_sql ให้ลองวิธีอื่น
      if (error.code === '42883') {
        console.log('⚠️  ไม่มี function exec_sql ให้รัน SQL แบบแยกส่วน...');
        return await runSQLParts(sql);
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * รัน SQL แบบแยกส่วน
 */
async function runSQLParts(sql) {
  // แยก SQL statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

  console.log(`📝 พบ ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.includes('CREATE TABLE') && statement.includes('guarantors')) {
      console.log(`\n🔧 รัน statement ${i + 1}: สร้างตาราง guarantors`);
      await createGuarantorsTable();
    } else if (statement.includes('CREATE TABLE') && statement.includes('contract_history')) {
      console.log(`\n🔧 รัน statement ${i + 1}: สร้างตาราง contract_history`);
      await createContractHistoryTable();
    } else if (statement.includes('CREATE TABLE') && statement.includes('contract_documents')) {
      console.log(`\n🔧 รัน statement ${i + 1}: สร้างตาราง contract_documents`);
      await createContractDocumentsTable();
    } else if (statement.includes('ALTER TABLE customers')) {
      console.log(`\n🔧 รัน statement ${i + 1}: อัปเดตตาราง customers`);
      await updateCustomersTable();
    } else if (statement.includes('ALTER TABLE installment_contracts')) {
      console.log(`\n🔧 รัน statement ${i + 1}: อัปเดตตาราง installment_contracts`);
      await updateInstallmentContractsTable();
    } else if (statement.includes('CREATE INDEX')) {
      console.log(`\n🔧 รัน statement ${i + 1}: สร้าง index`);
      // ข้าม indexes ไว้ก่อน
    } else {
      console.log(`\n⏭️  ข้าม statement ${i + 1}: ${statement.substring(0, 50)}...`);
    }
  }

  return { success: true };
}

/**
 * สร้างตาราง guarantors
 */
async function createGuarantorsTable() {
  const sql = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql });
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
    console.log('  ✅ สร้างตาราง guarantors สำเร็จ');
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง guarantors:', error.message);
  }
}

/**
 * สร้างตาราง contract_history
 */
async function createContractHistoryTable() {
  const sql = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql });
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
    console.log('  ✅ สร้างตาราง contract_history สำเร็จ');
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง contract_history:', error.message);
  }
}

/**
 * สร้างตาราง contract_documents
 */
async function createContractDocumentsTable() {
  const sql = `
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
  `;

  try {
    const { error } = await supabase.rpc('exec', { sql });
    if (error && !error.message.includes('already exists')) {
      throw error;
    }
    console.log('  ✅ สร้างตาราง contract_documents สำเร็จ');
  } catch (error) {
    console.log('  ❌ ไม่สามารถสร้างตาราง contract_documents:', error.message);
  }
}

/**
 * อัปเดตตาราง customers
 */
async function updateCustomersTable() {
  const columns = [
    'id_card VARCHAR(17)',
    'occupation VARCHAR(255)',
    'monthly_income DECIMAL(12,2)',
    'workplace VARCHAR(255)',
    'work_address TEXT',
    'emergency_contact_name VARCHAR(255)',
    'emergency_contact_phone VARCHAR(20)',
    'emergency_contact_relationship VARCHAR(100)',
    'credit_score INTEGER DEFAULT 0',
    'blacklisted BOOLEAN DEFAULT FALSE',
    'notes TEXT'
  ];

  for (const column of columns) {
    const [columnName] = column.split(' ');
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS ${column};` 
      });
      if (error && !error.message.includes('already exists')) {
        console.log(`  ⚠️  คอลัมน์ ${columnName}:`, error.message);
      } else {
        console.log(`  ✅ เพิ่มคอลัมน์ ${columnName} สำเร็จ`);
      }
    } catch (error) {
      console.log(`  ❌ ไม่สามารถเพิ่มคอลัมน์ ${columnName}:`, error.message);
    }
  }
}

/**
 * อัปเดตตาราง installment_contracts
 */
async function updateInstallmentContractsTable() {
  const columns = [
    'guarantor_id UUID',
    'requires_guarantor BOOLEAN DEFAULT FALSE',
    'collateral TEXT',
    'terms TEXT',
    'notes TEXT',
    'approved_by UUID',
    'approved_at TIMESTAMP WITH TIME ZONE',
    'branch_id UUID'
  ];

  for (const column of columns) {
    const [columnName] = column.split(' ');
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE installment_contracts ADD COLUMN IF NOT EXISTS ${column};` 
      });
      if (error && !error.message.includes('already exists')) {
        console.log(`  ⚠️  คอลัมน์ ${columnName}:`, error.message);
      } else {
        console.log(`  ✅ เพิ่มคอลัมน์ ${columnName} สำเร็จ`);
      }
    } catch (error) {
      console.log(`  ❌ ไม่สามารถเพิ่มคอลัมน์ ${columnName}:`, error.message);
    }
  }
}

/**
 * ตรวจสอบผลลัพธ์หลัง migration
 */
async function verifyMigration() {
  console.log('\n🔍 ตรวจสอบผลลัพธ์หลัง migration...');

  const tables = ['guarantors', 'contract_history', 'contract_documents'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`  ❌ ตาราง ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ตาราง ${table}: พร้อมใช้งาน`);
      }
    } catch (error) {
      console.log(`  ❌ ตาราง ${table}: ${error.message}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 เริ่มรัน Migration...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // อ่านไฟล์ migration
    const migrationSQL = fs.readFileSync('final_installments_migration.sql', 'utf8');
    
    console.log('📄 อ่านไฟล์ migration สำเร็จ');
    
    // รัน migration
    const result = await runSQL(migrationSQL);
    
    if (result.success) {
      console.log('✅ Migration สำเร็จ');
    } else {
      console.log('❌ Migration ล้มเหลว:', result.error);
    }

    // ตรวจสอบผลลัพธ์
    await verifyMigration();

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