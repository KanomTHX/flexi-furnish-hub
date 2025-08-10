import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmployeeProfilesStructure() {
  console.log('🔍 Checking employee_profiles table structure...\n');

  try {
    // ตรวจสอบโครงสร้างตาราง
    const { data: profiles, error } = await supabaseAdmin
      .from('employee_profiles')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error checking employee_profiles:', error.message);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log('✅ employee_profiles table structure:');
      console.log('Columns found:');
      Object.keys(profiles[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof profiles[0][column]}`);
      });

      console.log('\n📊 Sample data:');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${JSON.stringify(profile, null, 2)}`);
      });

      // ตรวจสอบ roles ที่มีอยู่
      const roles = [...new Set(profiles.map(p => p.role))];
      console.log('\n🎭 Unique roles found:');
      roles.forEach(role => {
        console.log(`   - ${role}`);
      });

      // ตรวจสอบว่ามี warehouse roles หรือไม่
      const hasWarehouseRoles = roles.some(role => 
        role && (
          role.includes('warehouse') || 
          role === 'warehouse_staff' || 
          role === 'warehouse_manager'
        )
      );

      if (hasWarehouseRoles) {
        console.log('\n✅ Warehouse roles found in the system');
      } else {
        console.log('\n⚠️  No warehouse roles found');
        console.log('Available roles:', roles.join(', '));
      }

    } else {
      console.log('⚠️  No data found in employee_profiles table');
    }

    // แสดง SQL สำหรับแก้ไขปัญหา
    console.log('\n📋 SQL to fix the issue:');
    console.log('='.repeat(80));
    console.log(`
-- Option 1: Use existing roles in RLS policies
-- Update the RLS policies to use roles that actually exist in your system

-- Option 2: Add warehouse roles to existing users
UPDATE employee_profiles 
SET role = 'admin' 
WHERE role IN ('manager', 'employee') 
AND id IN (SELECT id FROM employee_profiles LIMIT 2);

-- Option 3: Create RLS policies that work with any role for testing
DROP POLICY IF EXISTS "Warehouse staff can access serial numbers" ON public.product_serial_numbers;
CREATE POLICY "All authenticated users can access serial numbers" 
ON public.product_serial_numbers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Warehouse staff can access transfers" ON public.stock_transfers;
CREATE POLICY "All authenticated users can access transfers" 
ON public.stock_transfers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Warehouse staff can access transfer items" ON public.stock_transfer_items;
CREATE POLICY "All authenticated users can access transfer items" 
ON public.stock_transfer_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid()
));
    `);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmployeeProfilesStructure();