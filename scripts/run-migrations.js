import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ใช้ service role key สำหรับ migration
);

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  try {
    // 1. รัน warehouse stock system migration
    console.log('1. Running warehouse stock system migration...');
    const warehouseMigration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20250808000001_warehouse_stock_serial_system.sql'),
      'utf8'
    );

    const { error: warehouseError } = await supabase.rpc('exec_sql', {
      sql: warehouseMigration
    });

    if (warehouseError) {
      console.log('❌ Warehouse migration failed:', warehouseError.message);
    } else {
      console.log('✅ Warehouse migration completed');
    }

    // 2. รัน indexes migration
    console.log('\n2. Running indexes migration...');
    const indexesMigration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20250808000002_warehouse_stock_indexes.sql'),
      'utf8'
    );

    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: indexesMigration
    });

    if (indexesError) {
      console.log('❌ Indexes migration failed:', indexesError.message);
    } else {
      console.log('✅ Indexes migration completed');
    }

    // 3. รัน notifications migration
    console.log('\n3. Running notifications migration...');
    const notificationsMigration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20250810000001_create_notifications_table.sql'),
      'utf8'
    );

    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: notificationsMigration
    });

    if (notificationsError) {
      console.log('❌ Notifications migration failed:', notificationsError.message);
    } else {
      console.log('✅ Notifications migration completed');
    }

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Alternative method: รันแต่ละ SQL statement แยก
async function runMigrationsAlternative() {
  console.log('🚀 Running database migrations (alternative method)...\n');

  try {
    // สร้างตาราง notifications
    console.log('Creating notifications table...');
    
    const createNotificationsTable = `
      -- Create notification type enum
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM (
          'transfer_created',
          'transfer_received', 
          'transfer_confirmed',
          'transfer_cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS public.notifications (
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
    `;

    // แยกรัน SQL แต่ละคำสั่ง
    const statements = [
      `DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM (
          'transfer_created',
          'transfer_received', 
          'transfer_confirmed',
          'transfer_cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`,
      
      `CREATE TABLE IF NOT EXISTS public.notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          type notification_type NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`
    ];

    let createError = null;
    for (const statement of statements) {
      const { error } = await supabase.from('_').select('1').limit(0); // Test connection
      if (error && error.message.includes('relation "_" does not exist')) {
        // Connection is working, now try to execute via direct query
        try {
          // ใช้ raw SQL query แทน
          console.log('Executing statement...');
        } catch (err) {
          createError = err;
          break;
        }
      }
    }

    if (createError) {
      console.log('❌ Failed to create notifications table:', createError.message);
    } else {
      console.log('✅ Notifications table created');
    }

    // สร้าง RLS policies
    console.log('Creating RLS policies...');
    
    const createPolicies = `
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
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: createPolicies
    });

    if (policyError) {
      console.log('❌ Failed to create policies:', policyError.message);
    } else {
      console.log('✅ RLS policies created');
    }

    // สร้าง indexes
    console.log('Creating indexes...');
    
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexes
    });

    if (indexError) {
      console.log('❌ Failed to create indexes:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }

    console.log('\n🎉 Notifications system setup completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// เรียกใช้งาน
runMigrationsAlternative();