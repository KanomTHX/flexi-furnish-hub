// ===================================================================
// DISCOVER ALL REQUIRED COLUMNS
// ค้นหาคอลัมน์ที่จำเป็นทั้งหมดในครั้งเดียว
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
 * ค้นหาคอลัมน์ที่จำเป็นทั้งหมดโดยการลอง INSERT ข้อมูลเปล่า
 */
async function discoverAllRequiredColumns(tableName) {
  console.log(`🔍 ค้นหาคอลัมน์ที่จำเป็นทั้งหมดในตาราง ${tableName}...`);
  
  const allRequiredColumns = [];
  
  try {
    // ลอง INSERT ข้อมูลเปล่าเพื่อดู error
    const { error } = await supabase
      .from(tableName)
      .insert({});

    if (error) {
      console.log('📋 Error message:', error.message);
      
      // Parse error message เพื่อหาคอลัมน์ที่จำเป็นทั้งหมด
      if (error.message.includes('null value in column')) {
        // หา pattern ทั้งหมด
        const matches = error.message.match(/null value in column "([^"]+)"/g);
        if (matches) {
          matches.forEach(match => {
            const column = match.match(/"([^"]+)"/)[1];
            if (!allRequiredColumns.includes(column)) {
              allRequiredColumns.push(column);
              console.log(`  🔑 ${column} - REQUIRED`);
            }
          });
        }
        
        // ลองหา pattern อื่นๆ ด้วย
        const violatesPattern = error.message.match(/violates not-null constraint/);
        if (violatesPattern) {
          // หาชื่อคอลัมน์จาก context
          const contextMatches = error.message.match(/column "([^"]+)" of relation/g);
          if (contextMatches) {
            contextMatches.forEach(match => {
              const column = match.match(/"([^"]+)"/)[1];
              if (!allRequiredColumns.includes(column)) {
                allRequiredColumns.push(column);
                console.log(`  🔑 ${column} - REQUIRED (from constraint)`);
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Exception: ${error.message}`);
  }

  return allRequiredColumns;
}

/**
 * ลองสร้างข้อมูลทดสอบด้วยคอลัมน์ที่จำเป็นทั้งหมด
 */
async function testWithAllRequiredColumns(tableName, requiredColumns) {
  console.log(`\n🧪 ลองสร้างข้อมูลทดสอบด้วยคอลัมน์ที่จำเป็นทั้งหมด...`);
  
  const testData = {};
  
  // สร้างข้อมูลทดสอบสำหรับทุกคอลัมน์ที่จำเป็น
  for (const column of requiredColumns) {
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
    } else if (column === 'total_amount') {
      testData[column] = 10000;
    } else if (column === 'installment_amount') {
      testData[column] = 1666.67;
    } else if (column === 'status') {
      testData[column] = 'active';
    } else if (column === 'branch_id') {
      // ลองหา branch_id จริงก่อน
      try {
        const branchResult = await supabase.from('branches').select('id').limit(1);
        if (branchResult.data && branchResult.data.length > 0) {
          testData[column] = branchResult.data[0].id;
        } else {
          testData[column] = '00000000-0000-0000-0000-000000000000';
        }
      } catch (error) {
        testData[column] = '00000000-0000-0000-0000-000000000000';
      }
    } else if (column.includes('created_at') || column.includes('updated_at')) {
      // ข้าม timestamp columns - ให้ database จัดการ
    } else if (column.includes('id') && column !== 'plan_number') {
      testData[column] = '00000000-0000-0000-0000-000000000000';
    } else {
      testData[column] = 'test';
    }
  }

  console.log('📝 ข้อมูลทดสอบ:', JSON.stringify(testData, null, 2));

  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert(testData)
      .select();

    if (error) {
      console.log('❌ ยังไม่สามารถสร้างข้อมูลทดสอบได้:', error.message);
      
      // ถ้ายังมี error ให้วิเคราะห์เพิ่มเติม
      if (error.message.includes('null value in column')) {
        const newMatches = error.message.match(/null value in column "([^"]+)"/g);
        if (newMatches) {
          console.log('🔍 พบคอลัมน์ที่จำเป็นเพิ่มเติม:');
          newMatches.forEach(match => {
            const column = match.match(/"([^"]+)"/)[1];
            if (!requiredColumns.includes(column)) {
              console.log(`  🔑 ${column} - REQUIRED (เพิ่มเติม)`);
              requiredColumns.push(column);
            }
          });
        }
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
 * สร้าง migration script ที่สมบูรณ์ที่สุด
 */
function generateUltimateMigration(tableStructure, requiredColumns) {
  console.log('\n📝 สร้าง migration script ที่สมบูรณ์ที่สุด...');
  
  const columns = tableStructure ? Object.keys(tableStructure) : [];
  console.log('📊 คอลัมน์ทั้งหมด:', columns.join(', '));
  console.log('🔑 คอลัมน์ที่จำเป็น:', requiredColumns.join(', '));

  // สร้าง INSERT statement ที่ครบถ้วนที่สุด
  const migrationSQL = `-- ===================================================================
-- ULTIMATE MIGRATION FOR INSTALLMENT_PLANS
-- สร้างจากการตรวจสอบคอลัมน์ที่จำเป็นทั้งหมด
-- ===================================================================

-- คอลัมน์ที่จำเป็น: ${requiredColumns.join(', ')}

-- 1. เพิ่มคอลัมน์ที่อาจจะขาดหาย
ALTER TABLE installment_plans 
${requiredColumns.includes('name') && !columns.includes('name') ? 'ADD COLUMN IF NOT EXISTS name VARCHAR(255),' : ''}
${requiredColumns.includes('months') && !columns.includes('months') ? 'ADD COLUMN IF NOT EXISTS months INTEGER,' : ''}
${requiredColumns.includes('down_payment_percent') && !columns.includes('down_payment_percent') ? 'ADD COLUMN IF NOT EXISTS down_payment_percent DECIMAL(5,2),' : ''}
${requiredColumns.includes('processing_fee') && !columns.includes('processing_fee') ? 'ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10,2) DEFAULT 0,' : ''}
${requiredColumns.includes('description') && !columns.includes('description') ? 'ADD COLUMN IF NOT EXISTS description TEXT,' : ''}
${requiredColumns.includes('min_amount') && !columns.includes('min_amount') ? 'ADD COLUMN IF NOT EXISTS min_amount DECIMAL(12,2) DEFAULT 0,' : ''}
${requiredColumns.includes('max_amount') && !columns.includes('max_amount') ? 'ADD COLUMN IF NOT EXISTS max_amount DECIMAL(12,2),' : ''}
${requiredColumns.includes('requires_guarantor') && !columns.includes('requires_guarantor') ? 'ADD COLUMN IF NOT EXISTS requires_guarantor BOOLEAN DEFAULT FALSE,' : ''}
${requiredColumns.includes('is_active') && !columns.includes('is_active') ? 'ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,' : ''}
${requiredColumns.includes('total_amount') && !columns.includes('total_amount') ? 'ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2),' : ''}
${requiredColumns.includes('installment_amount') && !columns.includes('installment_amount') ? 'ADD COLUMN IF NOT EXISTS installment_amount DECIMAL(12,2),' : ''}
ADD COLUMN IF NOT EXISTS temp_column INTEGER; -- dummy column to avoid syntax error

-- ลบ dummy column
ALTER TABLE installment_plans DROP COLUMN IF EXISTS temp_column;

-- 2. เพิ่มข้อมูลตัวอย่าง
DO $$
DECLARE
    default_branch_id UUID;
BEGIN
    -- หา branch_id ที่ใช้ได้
    SELECT id INTO default_branch_id FROM branches LIMIT 1;
    IF default_branch_id IS NULL THEN
        default_branch_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;
    
    -- เพิ่มข้อมูลตัวอย่าง (ใส่คอลัมน์ที่จำเป็นทั้งหมด)
    INSERT INTO installment_plans (
        ${requiredColumns.map(col => {
          if (col.includes('created_at') || col.includes('updated_at') || col === 'id') {
            return null; // ข้าม auto-generated columns
          }
          return col;
        }).filter(Boolean).join(',\n        ')}
    )
    SELECT * FROM (VALUES
        (${requiredColumns.map(col => {
          if (col.includes('created_at') || col.includes('updated_at') || col === 'id') {
            return null;
          }
          switch(col) {
            case 'plan_number': return "'PLAN006'";
            case 'name': return "'ผ่อน 0% 6 งวด'";
            case 'months': return '6';
            case 'interest_rate': return '0.00';
            case 'down_payment': return '2000.00';
            case 'down_payment_percent': return '20.00';
            case 'processing_fee': return '500.00';
            case 'description': return "'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย'";
            case 'min_amount': return '5000';
            case 'max_amount': return '50000';
            case 'requires_guarantor': return 'FALSE';
            case 'is_active': return 'TRUE';
            case 'status': return "'active'";
            case 'total_amount': return '10000.00';
            case 'installment_amount': return '1333.33';
            case 'branch_id': return 'default_branch_id';
            default: return "'test'";
          }
        }).filter(Boolean).join(', ')})
    ) AS new_plans(${requiredColumns.map(col => {
      if (col.includes('created_at') || col.includes('updated_at') || col === 'id') {
        return null;
      }
      return col;
    }).filter(Boolean).join(', ')})
    WHERE NOT EXISTS (
        SELECT 1 FROM installment_plans 
        WHERE ${requiredColumns.includes('plan_number') ? 'installment_plans.plan_number = new_plans.plan_number' : '1=0'}
    );
    
    RAISE NOTICE 'Added installment plan successfully';
END $$;

-- เสร็จสิ้น
SELECT 'Ultimate installment_plans migration completed!' as result;`;

  console.log('📄 Ultimate Migration Script:');
  console.log(migrationSQL);

  // บันทึกไฟล์
  import('fs').then(fs => {
    fs.writeFileSync('ultimate_installment_plans_migration.sql', migrationSQL);
    console.log('💾 บันทึกไฟล์: ultimate_installment_plans_migration.sql');
  });

  return migrationSQL;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ค้นหาคอลัมน์ที่จำเป็นทั้งหมดและสร้าง migration ที่สมบูรณ์ที่สุด...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('installment_plans').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ค้นหาคอลัมน์ที่จำเป็นทั้งหมด
    const requiredColumns = await discoverAllRequiredColumns('installment_plans');
    
    // ลองสร้างข้อมูลทดสอบ
    const tableStructure = await testWithAllRequiredColumns('installment_plans', requiredColumns);
    
    // สร้าง migration script ที่สมบูรณ์ที่สุด
    generateUltimateMigration(tableStructure, requiredColumns);

    console.log('\n📋 สรุปคอลัมน์ที่จำเป็น:');
    requiredColumns.forEach(col => {
      console.log(`  🔑 ${col}`);
    });

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