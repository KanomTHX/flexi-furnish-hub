import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserRoles() {
  console.log('🔍 Checking user roles enum...\n');

  try {
    // ตรวจสอบ enum values ที่มีอยู่
    console.log('1. Checking existing user_role enum values...');
    
    const { data: enumData, error: enumError } = await supabaseAdmin
      .from('pg_enum')
      .select('enumlabel')
      .eq('enumtypid', 
        supabaseAdmin
          .from('pg_type')
          .select('oid')
          .eq('typname', 'user_role')
      );

    if (enumError) {
      console.log('❌ Error checking enum:', enumError.message);
    } else {
      console.log('✅ Current user_role enum values:');
      enumData?.forEach(item => {
        console.log(`   - ${item.enumlabel}`);
      });
    }

    // ตรวจสอบ employee_profiles table
    console.log('\n2. Checking employee_profiles table structure...');
    
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('employee_profiles')
      .select('role')
      .limit(5);

    if (profileError) {
      console.log('❌ Error checking profiles:', profileError.message);
    } else {
      console.log('✅ Sample roles in employee_profiles:');
      const uniqueRoles = [...new Set(profiles.map(p => p.role))];
      uniqueRoles.forEach(role => {
        console.log(`   - ${role}`);
      });
    }

    // ตรวจสอบ table schema
    console.log('\n3. Checking table schema...');
    
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_table_schema', { table_name: 'employee_profiles' });
        
      if (error) {
        console.log('⚠️  Cannot get schema via RPC');
      } else {
        console.log('✅ Table schema retrieved');
      }
    } catch (error) {
      console.log('⚠️  RPC not available, using alternative method');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRoles();