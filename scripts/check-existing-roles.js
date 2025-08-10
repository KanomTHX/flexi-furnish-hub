import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingRoles() {
  console.log('🔍 Checking existing roles in employee_profiles...\n');

  try {
    // ตรวจสอบ roles ที่มีอยู่ในระบบ
    const { data: profiles, error } = await supabaseAdmin
      .from('employee_profiles')
      .select('role, name, user_id')
      .limit(20);

    if (error) {
      console.log('❌ Error checking employee_profiles:', error.message);
      return;
    }

    console.log('✅ Current employee profiles and roles:');
    console.log('='.repeat(60));
    
    const roleCount = {};
    profiles.forEach(profile => {
      console.log(`${profile.name || 'No name'}: ${profile.role} (${profile.user_id})`);
      roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
    });

    console.log('\n📊 Role distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} users`);
    });

    // ตรวจสอบว่ามี warehouse roles หรือไม่
    const warehouseRoles = profiles.filter(p => 
      p.role && (
        p.role.includes('warehouse') || 
        p.role === 'warehouse_staff' || 
        p.role === 'warehouse_manager'
      )
    );

    if (warehouseRoles.length > 0) {
      console.log('\n✅ Found warehouse roles:');
      warehouseRoles.forEach(profile => {
        console.log(`   ${profile.name}: ${profile.role}`);
      });
    } else {
      console.log('\n⚠️  No warehouse roles found');
      console.log('   You may need to:');
      console.log('   1. Update existing users to have warehouse roles');
      console.log('   2. Create new users with warehouse roles');
    }

    // แสดง SQL สำหรับอัปเดต roles
    console.log('\n📋 SQL to update user roles:');
    console.log('='.repeat(80));
    console.log(`
-- Update existing users to have warehouse roles
UPDATE employee_profiles 
SET role = 'warehouse_manager' 
WHERE name = 'Manager Name' OR role = 'manager';

UPDATE employee_profiles 
SET role = 'warehouse_staff' 
WHERE name = 'Staff Name' OR role = 'employee';

-- Or insert new warehouse users
INSERT INTO employee_profiles (user_id, name, role, warehouse_id)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Warehouse Manager', 'warehouse_manager', (SELECT id FROM warehouses LIMIT 1)),
    ('00000000-0000-0000-0000-000000000002', 'Warehouse Staff', 'warehouse_staff', (SELECT id FROM warehouses LIMIT 1));
    `);
    console.log('='.repeat(80));

    // ตรวจสอบ warehouses ที่มีอยู่
    console.log('\n🏢 Available warehouses:');
    const { data: warehouses, error: warehouseError } = await supabaseAdmin
      .from('warehouses')
      .select('id, name, code, status')
      .eq('status', 'active');

    if (warehouseError) {
      console.log('❌ Error checking warehouses:', warehouseError.message);
    } else {
      warehouses.forEach(warehouse => {
        console.log(`   ${warehouse.name} (${warehouse.code}) - ${warehouse.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExistingRoles();