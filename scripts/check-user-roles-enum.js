import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserRolesEnum() {
  console.log('🔍 Checking user_role enum values...\n');

  try {
    // ตรวจสอบ enum values ที่มีอยู่
    const { data: enumData, error: enumError } = await supabaseAdmin
      .from('pg_enum')
      .select(`
        enumlabel,
        pg_type!inner(typname)
      `)
      .eq('pg_type.typname', 'user_role');

    if (enumError) {
      console.log('❌ Error checking enum:', enumError.message);
    } else if (enumData && enumData.length > 0) {
      console.log('✅ Current user_role enum values:');
      enumData.forEach(item => {
        console.log(`   - ${item.enumlabel}`);
      });
    } else {
      console.log('⚠️  No user_role enum found or no values');
    }

    // ตรวจสอบ employee_profiles table structure
    console.log('\n🔍 Checking employee_profiles table...');
    
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('employee_profiles')
      .select('role')
      .limit(5);

    if (profileError) {
      console.log('❌ Error checking employee_profiles:', profileError.message);
    } else {
      console.log('✅ Sample roles in employee_profiles:');
      const uniqueRoles = [...new Set(profiles.map(p => p.role))];
      uniqueRoles.forEach(role => {
        console.log(`   - ${role}`);
      });
    }

    // แสดง SQL สำหรับแก้ไข enum
    console.log('\n📋 SQL to fix user_role enum:');
    console.log('='.repeat(80));
    console.log(`
-- Add missing enum values to user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'warehouse_staff';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'warehouse_manager';

-- Or if you need to recreate the enum completely:
-- DROP TYPE IF EXISTS user_role CASCADE;
-- CREATE TYPE user_role AS ENUM (
--     'admin',
--     'manager', 
--     'employee',
--     'warehouse_manager',
--     'warehouse_staff',
--     'sales_staff',
--     'accountant'
-- );

-- Update the employee_profiles table to use the new enum
-- ALTER TABLE employee_profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
    `);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRolesEnum();