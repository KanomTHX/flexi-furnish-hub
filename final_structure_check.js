// ===================================================================
// FINAL STRUCTURE CHECK
// ตรวจสอบโครงสร้างครบถ้วนและสร้าง migration ที่สมบูรณ์
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
 * ตรวจสอบคอลัมน์ที่จำเป็นทั้งหมดในตาราง
 */
async function checkRequiredColumns(tableName) {
  console.log(`🔍 ตรวจสอบคอลัมน์ที่จำเป็นในตาราง ${tableName}...`);
  
  const requiredColumns = [];
  const optionalColumns = [];
  
  // ลองสร้างข้อมูลเปล่าเพื่อดู required columns
  try {
    const { error } = await supabase
      .from(tableName)
      .insert({});

    if (error && error.message.includes('null value in column')) {
      // Parse error message เพื่อหา required columns
      const matches = error.message.match(/null value in column "([^"]+)"/g);
      if (matches) {
        matches.forEach(match => {
          const column = match.match(/"([^"]+)"/)[1];
          requiredColumns.push(column);
          console.log(`  🔑 ${column} - REQUIRED`);
        });
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Error checking required columns: ${error.message}`);
  }

  return { requiredColumns, optionalColumns };
}

/**
 * ลองสร้างข้อมูลทดสอบด้วยค่าที่จำเป็น
 */
async function createTestRecord(tableName, requiredColumns) {
  console.log(`\n🧪 ลองสร้างข้อมูลทดสอบใน ${tableName}...`);
  
  const testData = {};
  
  // สร้างข้อมูลทดสอบสำหรับคอลัมน์ที่จำเป็น
  requiredColumns.forEach(column => {
    if (column === 'plan_number') {
      testData[column] = 'TEST001';
    } else if (column === 'name') {
      testData[column] = 'แผนทดสอบ';
    } else if (column === 'months') {
      testData[column] = 6;
    } else if (column === 'interest_rate') {
      testData[column] = 0;
    } else if (column === 'down_payment') {
      testData[column] = 1000;
    } else if (column === 'status') {
      testData[column] = 'active';
    } else if (column === 'branch_id') {
      testData[column] = '00000000-0000-0000-0000-000000000000';
    } else if (column.includes('created_at') || column.includes('updated_at')) {
      // ข้าม timestamp columns
    } else {
      testData[column] = 'test';
    }
  });

  console.log('📝 ข้อมูลทดสอบ:', JSON.stringify(testData, null, 2));

  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert(testData)
      .select();

    if (error) {
      console.log('❌ ไม่สามารถสร้างข้อมูลทดสอบ:', error.message);
      
      // วิเคราะห์ error เพิ่มเติม
      if (error.message.includes('invalid input syntax for type uuid')) {
        console.log('💡 ปัญหา UUID - ต้องใช้ ::uuid cast หรือ UUID จริง');
      }
      
      return null;
    } else {
      console.log('✅ สร้างข้อมูลทดสอบสำเร็จ!');
      console.log('📊 โครงสร้างที่ได้:', JSON.stringify(data[0], null, 2));
      
      // ลบข้อมูลทดสอบ
      if (data && data.length > 0) {
        await supabase.from(tableName).delete().eq('id', data[0].id);
        console.log('🗑️  ลบข้อมูลทดสอบแล้ว');
      }
      
      return data[0];
    }
  } catch (error) {
    console.log('❌ Exception:', error.message);
    return null;
  }
}

/**
 * สร้าง migration script ที่สมบูรณ์
 */
function generateCompleteMigration(tableStructure, requiredColumns) {
  console.log('\n📝 สร้าง migration script ที่สมบูรณ์...');
  
  if (!tableStructure) {
    console.log('❌ ไม่สามารถสร้าง migration script ได้');
    return;
  }

  const columns = Object.keys(tableStructure);
  console.log('📊 คอลัมน์ทั้งหมด:', columns.join(', '));
  console.log('🔑 คอลัมน์ที่จำเป็น:', requiredColumns.join(', '));

  // สร้าง INSERT statement ที่ครบถ้วน
  const insertSQL = `-- ===================================================================
-- COMPLETE MIGRATION FOR INSTALLMENT_PLANS
-- สร้างจากการตรวจสอบโครงสร้างจริง
-- ===================================================================

-- 1. เพิ่มคอลัมน์ที่อาจจะขาดหาย
${columns.includes('name') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);'}
${columns.includes('months') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS months INTEGER;'}
${columns.includes('down_payment_percent') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS down_payment_percent DECIMAL(5,2);'}
${columns.includes('processing_fee') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0;'}
${columns.includes('description') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS description TEXT;'}
${columns.includes('min_amount') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0;'}
${columns.includes('max_amount') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2);'}
${columns.includes('requires_guarantor') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE;'}
${columns.includes('is_active') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;'}

-- 2. เพิ่มข้อมูลตัวอย่าง (รวมคอลัมน์ที่จำเป็นทั้งหมด)
DO $$
DECLARE
    default_branch_id UUID;
BEGIN
    -- หา branch_id ที่ใช้ได้
    SELECT id INTO default_branch_id FROM branches LIMIT 1;
    IF default_branch_id IS NULL THEN
        default_branch_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- เพิ่มข้อมูลตัวอย่าง
    INSERT INTO installment_plans (
        ${requiredColumns.includes('plan_number') ? 'plan_number,' : ''}
        ${columns.includes('name') ? 'name,' : ''}
        ${columns.includes('months') ? 'months,' : ''}
        interest_rate,
        ${columns.includes('down_payment') ? 'down_payment,' : ''}
        ${columns.includes('down_payment_percent') ? 'down_payment_percent,' : ''}
        ${columns.includes('processing_fee') ? 'processing_fee,' : ''}
        ${columns.includes('description') ? 'description,' : ''}
        ${columns.includes('min_amount') ? 'min_amount,' : ''}
        ${columns.includes('max_amount') ? 'max_amount,' : ''}
        ${columns.includes('requires_guarantor') ? 'requires_guarantor,' : ''}
        ${columns.includes('is_active') ? 'is_active,' : ''}
        status${requiredColumns.includes('branch_id') ? ',\n        branch_id' : ''}
    )
    SELECT * FROM (VALUES
        (${requiredColumns.includes('plan_number') ? "'PLAN003'," : ''} ${columns.includes('name') ? "'ผ่อน 0% 3 งวด'," : ''} ${columns.includes('months') ? '3,' : ''} 0.00, ${columns.includes('down_payment') ? '1000.00,' : ''} ${columns.includes('down_payment_percent') ? '10.00,' : ''} ${columns.includes('processing_fee') ? '200.00,' : ''} ${columns.includes('description') ? "'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย'," : ''} ${columns.includes('min_amount') ? '3000,' : ''} ${columns.includes('max_amount') ? '30000,' : ''} ${columns.includes('requires_guarantor') ? 'FALSE,' : ''} ${columns.includes('is_active') ? 'TRUE,' : ''} 'active'${requiredColumns.includes('branch_id') ? ', default_branch_id' : ''}),
        (${requiredColumns.includes('plan_number') ? "'PLAN006'," : ''} ${columns.includes('name') ? "'ผ่อน 0% 6 งวด'," : ''} ${columns.includes('months') ? '6,' : ''} 0.00, ${columns.includes('down_payment') ? '2000.00,' : ''} ${columns.includes('down_payment_percent') ? '20.00,' : ''} ${columns.includes('processing_fee') ? '500.00,' : ''} ${columns.includes('description') ? "'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย'," : ''} ${columns.includes('min_amount') ? '5000,' : ''} ${columns.includes('max_amount') ? '50000,' : ''} ${columns.includes('requires_guarantor') ? 'FALSE,' : ''} ${columns.includes('is_active') ? 'TRUE,' : ''} 'active'${requiredColumns.includes('branch_id') ? ', default_branch_id' : ''}),
        (${requiredColumns.includes('plan_number') ? "'PLAN012'," : ''} ${columns.includes('name') ? "'ผ่อน 0% 12 งวด'," : ''} ${columns.includes('months') ? '12,' : ''} 0.00, ${columns.includes('down_payment') ? '3000.00,' : ''} ${columns.includes('down_payment_percent') ? '30.00,' : ''} ${columns.includes('processing_fee') ? '1000.00,' : ''} ${columns.includes('description') ? "'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย'," : ''} ${columns.includes('min_amount') ? '10000,' : ''} ${columns.includes('max_amount') ? '100000,' : ''} ${columns.includes('requires_guarantor') ? 'FALSE,' : ''} ${columns.includes('is_active') ? 'TRUE,' : ''} 'active'${requiredColumns.includes('branch_id') ? ', default_branch_id' : ''})
    ) AS new_plans(${requiredColumns.includes('plan_number') ? 'plan_number,' : ''} ${columns.includes('name') ? 'name,' : ''} ${columns.includes('months') ? 'months,' : ''} interest_rate, ${columns.includes('down_payment') ? 'down_payment,' : ''} ${columns.includes('down_payment_percent') ? 'down_payment_percent,' : ''} ${columns.includes('processing_fee') ? 'processing_fee,' : ''} ${columns.includes('description') ? 'description,' : ''} ${columns.includes('min_amount') ? 'min_amount,' : ''} ${columns.includes('max_amount') ? 'max_amount,' : ''} ${columns.includes('requires_guarantor') ? 'requires_guarantor,' : ''} ${columns.includes('is_active') ? 'is_active,' : ''} status${requiredColumns.includes('branch_id') ? ', branch_id' : ''})
    WHERE NOT EXISTS (
        SELECT 1 FROM installment_plans 
        WHERE ${requiredColumns.includes('plan_number') ? 'installment_plans.plan_number = new_plans.plan_number' : columns.includes('name') ? 'installment_plans.name = new_plans.name' : '1=0'}
    );
    
    RAISE NOTICE 'Added installment plans successfully';
END $$;

-- 3. สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_installment_plans_plan_number ON installment_plans(${requiredColumns.includes('plan_number') ? 'plan_number' : 'id'});
${columns.includes('name') ? 'CREATE INDEX IF NOT EXISTS idx_installment_plans_name ON installment_plans(name);' : ''}
${columns.includes('is_active') ? 'CREATE INDEX IF NOT EXISTS idx_installment_plans_active ON installment_plans(is_active);' : ''}

-- เสร็จสิ้น
SELECT 'Complete installment_plans migration finished!' as result;`;

  console.log('📄 Complete Migration Script:');
  console.log(insertSQL);

  // บันทึกไฟล์
  import('fs').then(fs => {
    fs.writeFileSync('complete_installment_plans_migration.sql', insertSQL);
    console.log('💾 บันทึกไฟล์: complete_installment_plans_migration.sql');
  });

  return insertSQL;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ตรวจสอบโครงสร้างครบถ้วนและสร้าง migration ที่สมบูรณ์...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('installment_plans').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบคอลัมน์ที่จำเป็น
    const { requiredColumns } = await checkRequiredColumns('installment_plans');
    
    // ลองสร้างข้อมูลทดสอบ
    const tableStructure = await createTestRecord('installment_plans', requiredColumns);
    
    // สร้าง migration script ที่สมบูรณ์
    generateCompleteMigration(tableStructure, requiredColumns);

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