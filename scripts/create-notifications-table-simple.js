import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createNotificationsTableSimple() {
  console.log('🚀 Creating notifications table (simple method)...\n');

  try {
    // ทดสอบการเชื่อมต่อก่อน
    console.log('Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('warehouses')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Connection failed:', testError.message);
      return;
    }
    console.log('✅ Connection successful');

    // ลองสร้างตารางโดยใช้ INSERT (จะ fail แต่จะบอกว่าตารางไม่มี)
    console.log('\nTesting notifications table...');
    const { data: notifTest, error: notifError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (notifError) {
      if (notifError.message.includes('does not exist')) {
        console.log('❌ notifications table does not exist');
        console.log('\n📋 Manual Setup Required:');
        console.log('Please run the following SQL in Supabase Dashboard:');
        console.log('\n' + '='.repeat(60));
        console.log(`
-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'transfer_created',
  'transfer_received', 
  'transfer_confirmed',
  'transfer_cancelled'
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
        `);
        console.log('='.repeat(60));
        console.log('\n🔗 Go to: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
      } else {
        console.log('❌ Other error:', notifError.message);
      }
    } else {
      console.log('✅ notifications table already exists');
    }

    // ตรวจสอบตาราง product_serial_numbers
    console.log('\nTesting product_serial_numbers table...');
    const { data: snTest, error: snError } = await supabase
      .from('product_serial_numbers')
      .select('id')
      .limit(1);

    if (snError) {
      if (snError.message.includes('does not exist')) {
        console.log('❌ product_serial_numbers table does not exist');
        console.log('\n📋 This table should be created by the warehouse migration');
        console.log('Please ensure the warehouse system migration has been run');
      } else {
        console.log('❌ Other error:', snError.message);
      }
    } else {
      console.log('✅ product_serial_numbers table exists');
    }

    // ตรวจสอบตาราง stock_transfers
    console.log('\nTesting stock_transfers table...');
    const { data: transferTest, error: transferError } = await supabase
      .from('stock_transfers')
      .select('id')
      .limit(1);

    if (transferError) {
      if (transferError.message.includes('does not exist')) {
        console.log('❌ stock_transfers table does not exist');
        console.log('\n📋 This table should be created by the warehouse migration');
      } else {
        console.log('❌ Other error:', transferError.message);
      }
    } else {
      console.log('✅ stock_transfers table exists');
    }

    console.log('\n🎯 Summary:');
    console.log('1. Create the notifications table using the SQL above');
    console.log('2. Ensure warehouse system tables are created');
    console.log('3. Run the test script again to verify');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createNotificationsTableSimple();