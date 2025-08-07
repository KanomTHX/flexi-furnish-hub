// ===================================================================
// DISCOVER TABLE STRUCTURE
// ค้นหาโครงสร้างตารางจริง
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
 * ลองใส่ข้อมูลแบบต่างๆ เพื่อค้นหาคอลัมน์ที่มีอยู่
 */
async function discoverColumns(tableName) {
  console.log(`🔍 ค้นหาโครงสร้างตาราง ${tableName}...`);
  
  // รายการคอลัมน์ที่อาจจะมี
  const possibleColumns = [
    // ชื่อแผน
    'name', 'plan_name', 'title', 'label',
    // จำนวนงวด
    'months', 'installments', 'periods', 'duration',
    // อัตราดอกเบี้ย
    'interest_rate', 'rate', 'annual_rate',
    // เงินดาวน์
    'down_payment_percent', 'down_payment', 'deposit_percent',
    // ค่าธรรมเนียม
    'processing_fee', 'fee', 'service_fee',
    // คำอธิบาย
    'description', 'details', 'note',
    // สถานะ
    'is_active', 'active', 'status', 'enabled',
    // ข้อมูลระบบ
    'id', 'created_at', 'updated_at', 'branch_id'
  ];

  const existingColumns = [];
  const nonExistingColumns = [];

  for (const column of possibleColumns) {
    try {
      // ลองสร้างข้อมูลที่มีแค่คอลัมน์นี้
      const testData = {};
      
      // ใส่ค่าทดสอบตามประเภทของคอลัมน์
      if (column.includes('id')) {
        testData[column] = '00000000-0000-0000-0000-000000000000';
      } else if (column.includes('percent') || column.includes('rate')) {
        testData[column] = 10.5;
      } else if (column.includes('months') || column.includes('installments')) {
        testData[column] = 6;
      } else if (column.includes('fee')) {
        testData[column] = 500;
      } else if (column.includes('active') || column.includes('enabled')) {
        testData[column] = true;
      } else if (column.includes('created_at') || column.includes('updated_at')) {
        testData[column] = new Date().toISOString();
      } else {
        testData[column] = 'test';
      }

      const { error } = await supabase
        .from(tableName)
        .insert(testData);

      if (error) {
        if (error.message.includes(`Could not find the '${column}' column`)) {
          nonExistingColumns.push(column);
          console.log(`  ❌ ${column} - ไม่มีอยู่`);
        } else if (error.message.includes('null value in column')) {
          // คอลัมน์มีอยู่แต่เป็น required
          existingColumns.push({ name: column, required: true });
          console.log(`  ✅ ${column} - มีอยู่ (required)`);
        } else {
          // คอลัมน์มีอยู่แต่มี error อื่น
          existingColumns.push({ name: column, required: false });
          console.log(`  ✅ ${column} - มีอยู่ (${error.message.substring(0, 50)}...)`);
        }
      } else {
        // สำเร็จ = คอลัมน์มีอยู่
        existingColumns.push({ name: column, required: false });
        console.log(`  ✅ ${column} - มีอยู่ (optional)`);
      }

      // รอสักครู่เพื่อไม่ให้ rate limit
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`  ⚠️  ${column} - Error: ${error.message}`);
    }
  }

  return { existingColumns, nonExistingColumns };
}

/**
 * ลองสร้างข้อมูลจริงด้วยคอลัมน์ที่พบ
 */
async function createTestRecord(tableName, existingColumns) {
  console.log(`\n🧪 ลองสร้างข้อมูลทดสอบใน ${tableName}...`);
  
  const testData = {};
  
  // สร้างข้อมูลทดสอบตามคอลัมน์ที่มี
  existingColumns.forEach(col => {
    const columnName = col.name;
    
    if (columnName.includes('name') || columnName.includes('title')) {
      testData[columnName] = 'แผนทดสอบ';
    } else if (columnName.includes('months') || columnName.includes('installments')) {
      testData[columnName] = 6;
    } else if (columnName.includes('rate')) {
      testData[columnName] = 0;
    } else if (columnName.includes('percent')) {
      testData[columnName] = 20;
    } else if (columnName.includes('fee')) {
      testData[columnName] = 500;
    } else if (columnName.includes('description')) {
      testData[columnName] = 'แผนทดสอบ 6 งวด';
    } else if (columnName.includes('active') || columnName.includes('enabled')) {
      testData[columnName] = true;
    } else if (columnName === 'id') {
      // ข้าม id ให้ auto generate
    } else if (columnName.includes('created_at') || columnName.includes('updated_at')) {
      // ข้าม timestamp ให้ auto generate
    } else {
      testData[columnName] = 'test';
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
 * สร้าง migration script ที่ถูกต้อง
 */
function generateFixedMigration(tableStructure) {
  console.log('\n📝 สร้าง migration script ที่แก้ไขแล้ว...');
  
  if (!tableStructure) {
    console.log('❌ ไม่สามารถสร้าง migration script ได้');
    return;
  }

  const columns = Object.keys(tableStructure);
  console.log('📊 คอลัมน์ที่ใช้ได้:', columns.join(', '));

  // หาคอลัมน์ที่ใช้สำหรับชื่อแผน
  let nameColumn = 'name';
  if (columns.includes('plan_name')) {
    nameColumn = 'plan_name';
  } else if (columns.includes('title')) {
    nameColumn = 'title';
  } else if (columns.includes('label')) {
    nameColumn = 'label';
  }

  // สร้าง INSERT statement
  const insertSQL = `-- ===================================================================
-- FIXED MIGRATION FOR INSTALLMENT_PLANS
-- แก้ไขตามโครงสร้างตารางจริง
-- ===================================================================

-- เพิ่มคอลัมน์ที่อาจจะขาดหาย (ถ้ายังไม่มี)
${columns.includes('name') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);'}
${columns.includes('description') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS description TEXT;'}
${columns.includes('min_amount') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0;'}
${columns.includes('max_amount') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2);'}
${columns.includes('requires_guarantor') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE;'}
${columns.includes('is_active') ? '' : 'ALTER TABLE installment_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;'}

-- เพิ่มข้อมูลตัวอย่าง (ใช้คอลัมน์ ${nameColumn})
INSERT INTO installment_plans (${nameColumn}${columns.includes('months') ? ', months' : ''}${columns.includes('interest_rate') ? ', interest_rate' : ''}${columns.includes('down_payment_percent') ? ', down_payment_percent' : ''}${columns.includes('processing_fee') ? ', processing_fee' : ''}${columns.includes('description') ? ', description' : ''}${columns.includes('is_active') ? ', is_active' : ''})
SELECT * FROM (VALUES
    ('ผ่อน 0% 6 งวด'${columns.includes('months') ? ', 6' : ''}${columns.includes('interest_rate') ? ', 0.00' : ''}${columns.includes('down_payment_percent') ? ', 20.00' : ''}${columns.includes('processing_fee') ? ', 500.00' : ''}${columns.includes('description') ? ', \'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย\'' : ''}${columns.includes('is_active') ? ', TRUE' : ''}),
    ('ผ่อน 0% 12 งวด'${columns.includes('months') ? ', 12' : ''}${columns.includes('interest_rate') ? ', 0.00' : ''}${columns.includes('down_payment_percent') ? ', 30.00' : ''}${columns.includes('processing_fee') ? ', 1000.00' : ''}${columns.includes('description') ? ', \'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย\'' : ''}${columns.includes('is_active') ? ', TRUE' : ''})
) AS new_plans(${nameColumn}${columns.includes('months') ? ', months' : ''}${columns.includes('interest_rate') ? ', interest_rate' : ''}${columns.includes('down_payment_percent') ? ', down_payment_percent' : ''}${columns.includes('processing_fee') ? ', processing_fee' : ''}${columns.includes('description') ? ', description' : ''}${columns.includes('is_active') ? ', is_active' : ''})
WHERE NOT EXISTS (
    SELECT 1 FROM installment_plans 
    WHERE installment_plans.${nameColumn} = new_plans.${nameColumn}
);

-- เสร็จสิ้น
SELECT 'Fixed migration completed!' as result;`;

  console.log('📄 Fixed Migration Script:');
  console.log(insertSQL);

  // บันทึกไฟล์
  import('fs').then(fs => {
    fs.writeFileSync('fixed_installment_plans_migration.sql', insertSQL);
    console.log('💾 บันทึกไฟล์: fixed_installment_plans_migration.sql');
  });

  return insertSQL;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ค้นหาโครงสร้างตารางจริง...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('installment_plans').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ค้นหาคอลัมน์ที่มีอยู่
    const { existingColumns } = await discoverColumns('installment_plans');
    
    console.log('\n📋 สรุปคอลัมน์ที่พบ:');
    existingColumns.forEach(col => {
      console.log(`  ✅ ${col.name} ${col.required ? '(required)' : '(optional)'}`);
    });

    // ลองสร้างข้อมูลทดสอบ
    const tableStructure = await createTestRecord('installment_plans', existingColumns);
    
    // สร้าง migration script ที่แก้ไขแล้ว
    generateFixedMigration(tableStructure);

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