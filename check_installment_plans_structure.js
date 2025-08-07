// ===================================================================
// CHECK INSTALLMENT PLANS STRUCTURE
// ตรวจสอบโครงสร้างตาราง installment_plans
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
 * ตรวจสอบโครงสร้างตาราง installment_plans
 */
async function checkInstallmentPlansStructure() {
  console.log('🔍 ตรวจสอบโครงสร้างตาราง installment_plans...');
  
  try {
    // ลองดึงข้อมูลเพื่อดูโครงสร้าง
    const { data, error } = await supabase
      .from('installment_plans')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ ไม่สามารถเข้าถึงตาราง installment_plans:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      console.log('✅ พบข้อมูลในตาราง installment_plans');
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
        const { error: insertError } = await supabase
          .from('installment_plans')
          .insert({});
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
    console.error('❌ Error checking installment_plans:', error.message);
    return null;
  }
}

/**
 * ลองสร้างข้อมูลทดสอบเพื่อดูโครงสร้าง
 */
async function tryCreateTestData() {
  console.log('\n🧪 ลองสร้างข้อมูลทดสอบ...');
  
  // ลองใส่ข้อมูลแบบต่างๆ เพื่อดูว่าคอลัมน์ไหนที่มีอยู่
  const testCases = [
    // Case 1: ใช้ชื่อคอลัมน์ที่คาดว่าจะมี
    {
      name: 'ทดสอบ',
      months: 6,
      interest_rate: 0,
      down_payment_percent: 20,
      processing_fee: 500
    },
    // Case 2: ใช้ชื่อคอลัมน์แบบอื่น
    {
      plan_name: 'ทดสอบ',
      months: 6,
      interest_rate: 0,
      down_payment_percent: 20,
      processing_fee: 500
    },
    // Case 3: ใช้ชื่อคอลัมน์แบบง่ายๆ
    {
      months: 6,
      interest_rate: 0
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    console.log(`\n📝 ทดสอบ Case ${i + 1}:`, JSON.stringify(testCases[i]));
    
    try {
      const { data, error } = await supabase
        .from('installment_plans')
        .insert(testCases[i])
        .select();

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        
        // วิเคราะห์ error message
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const match = error.message.match(/column "([^"]+)" of relation/);
          if (match) {
            console.log(`  💡 คอลัมน์ "${match[1]}" ไม่มีอยู่`);
          }
        }
      } else {
        console.log(`  ✅ สำเร็จ! ข้อมูลที่สร้าง:`, data);
        
        // ลบข้อมูลทดสอบ
        if (data && data.length > 0) {
          await supabase.from('installment_plans').delete().eq('id', data[0].id);
          console.log(`  🗑️  ลบข้อมูลทดสอบแล้ว`);
        }
        
        return data[0]; // return โครงสร้างที่ใช้ได้
      }
    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }

  return null;
}

/**
 * สร้าง SQL script ที่ถูกต้อง
 */
function generateCorrectSQL(workingStructure) {
  console.log('\n📝 สร้าง SQL script ที่ถูกต้อง...');
  
  if (!workingStructure) {
    console.log('❌ ไม่สามารถสร้าง SQL script ได้ เนื่องจากไม่ทราบโครงสร้างที่ถูกต้อง');
    return;
  }

  const columns = Object.keys(workingStructure);
  console.log('📊 คอลัมน์ที่ใช้ได้:', columns.join(', '));

  // สร้าง INSERT statement ที่ถูกต้อง
  let insertSQL = '';
  
  if (columns.includes('name')) {
    insertSQL = `
-- เพิ่มข้อมูลตัวอย่างสำหรับ installment_plans (ใช้คอลัมน์ name)
INSERT INTO installment_plans (name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
SELECT * FROM (VALUES
    ('ผ่อน 0% 3 งวด', 3, 0.00, 10.00, 200.00, 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3000, 30000, FALSE, TRUE),
    ('ผ่อน 0% 6 งวด', 6, 0.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE, TRUE),
    ('ผ่อน 0% 12 งวด', 12, 0.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE, TRUE)
) AS new_plans(name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM installment_plans 
    WHERE installment_plans.name = new_plans.name 
    AND installment_plans.months = new_plans.months
);`;
  } else if (columns.includes('plan_name')) {
    insertSQL = `
-- เพิ่มข้อมูลตัวอย่างสำหรับ installment_plans (ใช้คอลัมน์ plan_name)
INSERT INTO installment_plans (plan_name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
SELECT * FROM (VALUES
    ('ผ่อน 0% 3 งวด', 3, 0.00, 10.00, 200.00, 'ผ่อนชำระ 3 งวด ไม่มีดอกเบี้ย', 3000, 30000, FALSE, TRUE),
    ('ผ่อน 0% 6 งวด', 6, 0.00, 20.00, 500.00, 'ผ่อนชำระ 6 งวด ไม่มีดอกเบี้ย', 5000, 50000, FALSE, TRUE),
    ('ผ่อน 0% 12 งวด', 12, 0.00, 30.00, 1000.00, 'ผ่อนชำระ 12 งวด ไม่มีดอกเบี้ย', 10000, 100000, FALSE, TRUE)
) AS new_plans(plan_name, months, interest_rate, down_payment_percent, processing_fee, description, min_amount, max_amount, requires_guarantor, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM installment_plans 
    WHERE installment_plans.plan_name = new_plans.plan_name 
    AND installment_plans.months = new_plans.months
);`;
  } else {
    insertSQL = `
-- ไม่สามารถสร้าง INSERT statement ได้ เนื่องจากไม่มีคอลัมน์ name หรือ plan_name
-- คอลัมน์ที่มีอยู่: ${columns.join(', ')}
-- กรุณาตรวจสอบโครงสร้างตารางและแก้ไข INSERT statement ด้วยตนเอง`;
  }

  console.log('📄 SQL Script ที่แก้ไขแล้ว:');
  console.log(insertSQL);

  // บันทึกไฟล์
  import('fs').then(fs => {
    fs.writeFileSync('corrected_installment_plans_insert.sql', insertSQL);
    console.log('💾 บันทึกไฟล์: corrected_installment_plans_insert.sql');
  });

  return insertSQL;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ตรวจสอบโครงสร้างตาราง installment_plans...');
  console.log(`📡 URL: ${supabaseUrl}`);

  try {
    // ตรวจสอบการเชื่อมต่อ
    const { data, error } = await supabase.from('installment_plans').select('id').limit(1);
    if (error && !error.message.includes('does not exist')) {
      throw new Error(`ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${error.message}`);
    }
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบโครงสร้าง
    const columns = await checkInstallmentPlansStructure();
    
    // ลองสร้างข้อมูลทดสอบ
    const workingStructure = await tryCreateTestData();
    
    // สร้าง SQL script ที่ถูกต้อง
    generateCorrectSQL(workingStructure);

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