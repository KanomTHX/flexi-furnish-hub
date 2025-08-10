import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function createTablesViaRestAPI() {
  console.log('🚀 Creating tables via REST API...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing environment variables');
    console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
    return;
  }

  // SQL สำหรับสร้างตาราง notifications
  const createNotificationsSQL = `
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('transfer_created', 'transfer_received', 'transfer_confirmed', 'transfer_cancelled')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
  `;

  try {
    console.log('1. Creating notifications table via SQL query...');
    
    // ลองใช้ PostgREST SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ 
        sql: createNotificationsSQL 
      })
    });

    if (response.ok) {
      console.log('✅ Notifications table created successfully');
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to create table via REST API:', errorText);
      
      // แสดง SQL ให้ copy ไปรันเอง
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
      console.log('\n' + '='.repeat(80));
      console.log(createNotificationsSQL);
      console.log('='.repeat(80));
      console.log('\n🔗 Go to: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
    
    console.log('\n📋 Manual Setup Required - Copy this SQL to Supabase Dashboard:');
    console.log('\n' + '='.repeat(80));
    console.log(createNotificationsSQL);
    console.log('='.repeat(80));
    console.log('\n🔗 Go to: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
  }

  // ทดสอบการเชื่อมต่อและตรวจสอบตาราง
  console.log('\n2. Testing table access...');
  
  try {
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    if (testResponse.ok) {
      console.log('✅ notifications table is accessible');
    } else {
      const errorText = await testResponse.text();
      if (errorText.includes('does not exist')) {
        console.log('❌ notifications table does not exist yet');
      } else {
        console.log('⚠️  notifications table access issue:', errorText);
      }
    }
  } catch (error) {
    console.log('❌ Error testing table access:', error.message);
  }

  // ตรวจสอบตารางอื่นๆ ที่จำเป็น
  console.log('\n3. Checking other required tables...');
  
  const requiredTables = [
    'product_serial_numbers',
    'stock_transfers', 
    'stock_transfer_items',
    'products',
    'warehouses',
    'employee_profiles'
  ];

  for (const tableName of requiredTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (response.ok) {
        console.log(`✅ Table "${tableName}" exists and accessible`);
      } else {
        const errorText = await response.text();
        if (errorText.includes('does not exist')) {
          console.log(`❌ Table "${tableName}" does not exist`);
        } else {
          console.log(`⚠️  Table "${tableName}" has issues`);
        }
      }
    } catch (error) {
      console.log(`❌ Error checking table "${tableName}":`, error.message);
    }
  }

  console.log('\n🎯 Summary:');
  console.log('If the notifications table was not created automatically,');
  console.log('please copy the SQL above and run it in Supabase Dashboard.');
  console.log('\nAfter creating the table, run:');
  console.log('node scripts/test-enhanced-transfer-system.js');
}

// เรียกใช้งาน
createTablesViaRestAPI();