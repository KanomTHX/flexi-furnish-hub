import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createNotificationsTable() {
  try {
    console.log('🚀 กำลังสร้างตาราง notifications...');
    
    // Use the REST API to execute SQL directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: `
          CREATE TABLE IF NOT EXISTS public.notifications (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
              is_read BOOLEAN DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
          CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
          
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        `
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('⚠️ Direct SQL execution failed:', error);
      
      // Try alternative approach - create via Supabase Dashboard API
      console.log('🔄 Trying alternative approach...');
      
      // Since we can't create the table directly, let's check if we can at least
      // verify the existing schema and suggest manual creation
      const { data: tables, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log('📋 Available tables check failed. Manual table creation required.');
        console.log('\n📝 Please create the notifications table manually in Supabase Dashboard:');
        console.log('\n-- SQL to run in Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);`);
      } else {
        console.log('📋 Current tables:', tables?.map(t => t.table_name).join(', '));
      }
      
      return false;
    }
    
    console.log('✅ Table creation completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function verifyTable() {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table verification failed:', error.message);
      return false;
    }
    
    console.log('✅ ตาราง notifications พร้อมใช้งานแล้ว!');
    return true;
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return false;
  }
}

async function main() {
  const created = await createNotificationsTable();
  
  if (created) {
    await verifyTable();
  }
  
  // Always try to verify, even if creation failed
  // (in case table was created manually)
  setTimeout(async () => {
    console.log('\n🔍 Final verification...');
    await verifyTable();
  }, 1000);
}

main();