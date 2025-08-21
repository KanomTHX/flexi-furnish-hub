import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  try {
    console.log('🔍 ตรวจสอบฟังก์ชันที่มีอยู่ในฐานข้อมูล...');
    
    // ตรวจสอบฟังก์ชันที่มีชื่อขึ้นต้นด้วย generate ด้วย SQL query
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name LIKE 'generate%'
      `
    });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('📋 ฟังก์ชันที่พบ:');
    if (data && data.length > 0) {
      data.forEach(func => {
        console.log(`- ${func.routine_name} (${func.routine_type})`);
      });
    } else {
      console.log('❌ ไม่พบฟังก์ชันที่ขึ้นต้นด้วย "generate"');
    }
    
    // ตรวจสอบฟังก์ชันทั้งหมดใน schema public
    console.log('\n🔍 ตรวจสอบฟังก์ชันทั้งหมดใน public schema...');
    const { data: allFunctions, error: allError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
      `
    });
    
    if (allError) {
      console.error('❌ Error:', allError);
      return;
    }
    
    console.log('📋 ฟังก์ชันทั้งหมด:');
    if (allFunctions && allFunctions.length > 0) {
      allFunctions.forEach(func => {
        console.log(`- ${func.routine_name}`);
      });
    } else {
      console.log('❌ ไม่พบฟังก์ชันใน public schema');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

checkFunctions();