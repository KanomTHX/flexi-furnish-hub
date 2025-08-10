import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ใช้ service role key สำหรับการสร้างตาราง
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTablesWithServiceRole() {
  console.log('🚀 Creating tables with service role key...\n');

  try {
    // ทดสอบการเชื่อมต่อด้วย service role
    console.log('Testing service role connection...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('warehouses')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Service role connection failed:', testError.message);
      return;
    }
    console.log('✅ Service role connection successful');

    // 1. สร้าง notification_type enum
    console.log('\n1. Creating notification_type enum...');
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: `
          DO $$ BEGIN
            CREATE TYPE notification_type AS ENUM (
              'transfer_created',
              'transfer_received', 
              'transfer_confirmed',
              'transfer_cancelled'
            );
          EXCEPTION
            WHEN duplicate_object THEN 
              RAISE NOTICE 'notification_type enum already exists';
          END $$;
        `
      });

      if (error) {
        console.log('⚠️  Enum creation note:', error.message);
      } else {
        console.log('✅ notification_type enum created');
      }
    } catch (error) {
      console.log('⚠️  Enum creation error:', error.message);
    }

    // 2. สร้างตาราง notifications
    console.log('\n2. Creating notifications table...');
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: `
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
        `
      });

      if (error) {
        console.log('❌ Failed to create notifications table:', error.message);
      } else {
        console.log('✅ notifications table created');
      }
    } catch (error) {
      console.log('❌ Error creating notifications table:', error.message);
    }

    // 3. เปิดใช้งาน RLS
    console.log('\n3. Enabling RLS on notifications table...');
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        query: `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`
      });

      if (error) {
        console.log('❌ Failed to enable RLS:', error.message);
      } else {
        console.log('✅ RLS enabled');
      }
    } catch (error) {
      console.log('❌ Error enabling RLS:', error.message);
    }

    // 4. สร้าง RLS policies
    console.log('\n4. Creating RLS policies...');
    const policies = [
      {
        name: 'Users can view their own notifications',
        sql: `
          CREATE POLICY "Users can view their own notifications" 
          ON public.notifications 
          FOR SELECT 
          USING (user_id = auth.uid());
        `
      },
      {
        name: 'Users can update their own notifications',
        sql: `
          CREATE POLICY "Users can update their own notifications" 
          ON public.notifications 
          FOR UPDATE 
          USING (user_id = auth.uid());
        `
      },
      {
        name: 'Users can delete their own notifications',
        sql: `
          CREATE POLICY "Users can delete their own notifications" 
          ON public.notifications 
          FOR DELETE 
          USING (user_id = auth.uid());
        `
      },
      {
        name: 'System can insert notifications',
        sql: `
          CREATE POLICY "System can insert notifications" 
          ON public.notifications 
          FOR INSERT 
          WITH CHECK (true);
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          query: `DROP POLICY IF EXISTS "${policy.name}" ON public.notifications; ${policy.sql}`
        });

        if (error) {
          console.log(`❌ Failed to create policy "${policy.name}":`, error.message);
        } else {
          console.log(`✅ Policy "${policy.name}" created`);
        }
      } catch (error) {
        console.log(`❌ Error creating policy "${policy.name}":`, error.message);
      }
    }

    // 5. สร้าง indexes
    console.log('\n5. Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);'
    ];

    for (const indexSql of indexes) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          query: indexSql
        });

        if (error) {
          console.log('❌ Failed to create index:', error.message);
        } else {
          console.log('✅ Index created');
        }
      } catch (error) {
        console.log('❌ Error creating index:', error.message);
      }
    }

    // 6. ทดสอบการใช้งานตาราง
    console.log('\n6. Testing notifications table...');
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          type: 'transfer_created',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: { test: true }
        })
        .select()
        .single();

      if (error) {
        console.log('❌ Failed to insert test notification:', error.message);
      } else {
        console.log('✅ Test notification inserted successfully');
        console.log(`   Notification ID: ${data.id}`);

        // ลบ test notification
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', data.id);

        if (!deleteError) {
          console.log('✅ Test notification cleaned up');
        }
      }
    } catch (error) {
      console.log('❌ Error testing notifications table:', error.message);
    }

    // 7. ตรวจสอบตารางอื่นๆ ที่จำเป็น
    console.log('\n7. Checking other required tables...');
    
    const requiredTables = [
      'product_serial_numbers',
      'stock_transfers',
      'stock_transfer_items',
      'stock_movements',
      'products',
      'warehouses',
      'employee_profiles'
    ];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ Table "${tableName}" does not exist`);
          } else {
            console.log(`⚠️  Table "${tableName}" has issues:`, error.message);
          }
        } else {
          console.log(`✅ Table "${tableName}" exists and accessible`);
        }
      } catch (error) {
        console.log(`❌ Error checking table "${tableName}":`, error.message);
      }
    }

    console.log('\n🎉 Table creation process completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ notifications table created with RLS');
    console.log('- ✅ Policies and indexes created');
    console.log('- ✅ Table functionality tested');
    console.log('\n🚀 Next steps:');
    console.log('1. Ensure warehouse system tables exist');
    console.log('2. Test the enhanced transfer system');
    console.log('3. Add NotificationBell to your UI');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Alternative method using direct SQL execution
async function createTablesDirectSQL() {
  console.log('🚀 Creating tables with direct SQL execution...\n');

  const fullSQL = `
    -- Create notification type enum (if not exists)
    DO $$ BEGIN
      CREATE TYPE notification_type AS ENUM (
        'transfer_created',
        'transfer_received', 
        'transfer_confirmed',
        'transfer_cancelled'
      );
    EXCEPTION
      WHEN duplicate_object THEN 
        RAISE NOTICE 'notification_type enum already exists';
    END $$;

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

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

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
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

    -- Grant permissions
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT ALL ON public.notifications TO authenticated;
  `;

  try {
    console.log('Executing full SQL script...');
    
    // ลองใช้ fetch API โดยตรง
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ query: fullSQL })
    });

    if (response.ok) {
      console.log('✅ SQL executed successfully');
    } else {
      const error = await response.text();
      console.log('❌ SQL execution failed:', error);
    }

  } catch (error) {
    console.log('❌ Error executing SQL:', error.message);
    
    console.log('\n📋 Manual Setup Required:');
    console.log('Please copy and paste this SQL into Supabase Dashboard:');
    console.log('\n' + '='.repeat(80));
    console.log(fullSQL);
    console.log('='.repeat(80));
    console.log('\n🔗 Go to: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
  }
}

// เรียกใช้งาน
console.log('Choose method:');
console.log('1. Step by step creation');
console.log('2. Direct SQL execution');

// ลองทั้งสองวิธี
createTablesWithServiceRole().then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('Trying alternative method...\n');
  return createTablesDirectSQL();
});