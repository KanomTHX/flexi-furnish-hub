import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTableColumns() {
  console.log('🔍 ตรวจสอบ columns ของตาราง installment_plans...\n');

  try {
    // ใช้ SQL query เพื่อดู columns
    const { data, error } = await supabase.rpc('get_table_columns', {
      table_name: 'installment_plans'
    });

    if (error) {
      console.log('ลองใช้วิธีอื่น...');
      
      // ลองดึงข้อมูล 1 row เพื่อดู structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('installment_plans')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error('❌ Error:', sampleError);
        
        // ลองใช้ information_schema
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'installment_plans')
          .eq('table_schema', 'public');

        if (schemaError) {
          console.error('❌ Schema Error:', schemaError);
          return;
        }

        console.log('📋 Columns จาก information_schema:');
        schemaData.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
      } else {
        if (sampleData && sampleData.length > 0) {
          console.log('📋 Columns จากข้อมูลตัวอย่าง:');
          Object.keys(sampleData[0]).forEach(key => {
            console.log(`   - ${key}`);
          });
        } else {
          console.log('📋 ตารางว่าง - ลองสร้างข้อมูลทดสอบ...');
          
          // ลองสร้างข้อมูลทดสอบเพื่อดู error
          const testData = {
            plan_number: 'TEST001',
            name: 'ทดสอบ',
            months: 6,
            interest_rate: 0
          };

          const { error: insertError } = await supabase
            .from('installment_plans')
            .insert([testData]);

          if (insertError) {
            console.log('❌ Insert Error (ช่วยให้เห็น column names):');
            console.log(insertError.message);
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTableColumns();