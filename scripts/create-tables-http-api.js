import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createTablesViaHTTP() {
  console.log('🚀 Creating tables via HTTP API with service role...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing environment variables');
    return;
  }

  // SQL commands to execute
  const sqlCommands = [
    {
      name: 'Create notifications table',
      sql: `
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
    },
    {
      name: 'Enable RLS on notifications',
      sql: `ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Create notifications policies',
      sql: `
        DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
        CREATE POLICY "Users can view their own notifications" 
        ON public.notifications 
        FOR SELECT 
        USING (user_id = auth.uid());

        DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
        CREATE POLICY "System can insert notifications" 
        ON public.notifications 
        FOR INSERT 
        WITH CHECK (true);

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
      `
    },
    {
      name: 'Create notifications indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
      `
    },
    {
      name: 'Create product_serial_numbers table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.product_serial_numbers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            serial_number VARCHAR(50) UNIQUE NOT NULL,
            product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
            unit_cost NUMERIC(10,2) NOT NULL,
            supplier_id UUID,
            invoice_number VARCHAR(100),
            status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'transferred', 'claimed', 'damaged', 'reserved')),
            sold_at TIMESTAMP WITH TIME ZONE,
            sold_to VARCHAR(255),
            reference_number VARCHAR(100),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create stock_transfers table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.stock_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transfer_number VARCHAR(50) UNIQUE NOT NULL,
            source_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
            target_warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
            status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'in_transit', 'delivered', 'completed', 'cancelled')),
            total_items INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            initiated_by UUID NOT NULL,
            confirmed_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            confirmed_at TIMESTAMP WITH TIME ZONE
        );
      `
    },
    {
      name: 'Create stock_transfer_items table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
            serial_number_id UUID NOT NULL REFERENCES public.product_serial_numbers(id),
            product_id UUID NOT NULL REFERENCES public.products(id),
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_cost NUMERIC(10,2) NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'in_transit', 'delivered', 'completed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'Enable RLS on warehouse tables',
      sql: `
        ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
      `
    },
    {
      name: 'Create warehouse table policies',
      sql: `
        DROP POLICY IF EXISTS "Warehouse staff can access serial numbers" ON public.product_serial_numbers;
        CREATE POLICY "Warehouse staff can access serial numbers" 
        ON public.product_serial_numbers 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid() 
            AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
        ));

        DROP POLICY IF EXISTS "Warehouse staff can access transfers" ON public.stock_transfers;
        CREATE POLICY "Warehouse staff can access transfers" 
        ON public.stock_transfers 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid() 
            AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
        ));

        DROP POLICY IF EXISTS "Warehouse staff can access transfer items" ON public.stock_transfer_items;
        CREATE POLICY "Warehouse staff can access transfer items" 
        ON public.stock_transfer_items 
        FOR ALL 
        USING (EXISTS (
            SELECT 1 FROM employee_profiles ep 
            WHERE ep.user_id = auth.uid() 
            AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
        ));
      `
    },
    {
      name: 'Create warehouse table indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_serial_number ON public.product_serial_numbers(serial_number);
        CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_product_id ON public.product_serial_numbers(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_warehouse_id ON public.product_serial_numbers(warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_product_serial_numbers_status ON public.product_serial_numbers(status);

        CREATE INDEX IF NOT EXISTS idx_stock_transfers_source_warehouse ON public.stock_transfers(source_warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_stock_transfers_target_warehouse ON public.stock_transfers(target_warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON public.stock_transfers(status);
        CREATE INDEX IF NOT EXISTS idx_stock_transfers_transfer_number ON public.stock_transfers(transfer_number);

        CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_transfer_id ON public.stock_transfer_items(transfer_id);
        CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_serial_number_id ON public.stock_transfer_items(serial_number_id);
      `
    },
    {
      name: 'Create helper functions',
      sql: `
        CREATE OR REPLACE FUNCTION generate_transfer_number() 
        RETURNS TEXT AS $$
        DECLARE
            year_part TEXT;
            month_part TEXT;
            sequence_num INTEGER;
            transfer_number TEXT;
        BEGIN
            year_part := EXTRACT(YEAR FROM NOW())::TEXT;
            month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
            
            SELECT COALESCE(MAX(
                CAST(
                    SUBSTRING(transfer_number FROM 9) AS INTEGER
                )
            ), 0) + 1
            INTO sequence_num
            FROM stock_transfers
            WHERE transfer_number LIKE 'TF' || year_part || month_part || '%';
            
            transfer_number := 'TF' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
            
            RETURN transfer_number;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Grant permissions',
      sql: `
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT ALL ON public.notifications TO authenticated;
        GRANT ALL ON public.product_serial_numbers TO authenticated;
        GRANT ALL ON public.stock_transfers TO authenticated;
        GRANT ALL ON public.stock_transfer_items TO authenticated;
        GRANT EXECUTE ON FUNCTION generate_transfer_number() TO authenticated;
      `
    }
  ];

  // Execute each SQL command
  let successCount = 0;
  let failCount = 0;

  for (const command of sqlCommands) {
    try {
      console.log(`Executing: ${command.name}...`);
      
      // Use PostgreSQL REST API endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          sql: command.sql
        })
      });

      if (response.ok || response.status === 204) {
        console.log(`✅ ${command.name} - Success`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`❌ ${command.name} - Failed: ${errorText}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${command.name} - Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} success, ${failCount} failed`);

  if (failCount > 0) {
    console.log('\n📋 If some commands failed, try running the complete SQL manually:');
    console.log('🔗 https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
    console.log('\nCopy this complete SQL:');
    console.log('='.repeat(80));
    
    const completeSql = sqlCommands.map(cmd => `-- ${cmd.name}\n${cmd.sql}`).join('\n\n');
    console.log(completeSql);
    console.log('='.repeat(80));
  }

  // Test the created tables
  console.log('\n🔍 Testing created tables...');
  
  const testTables = ['notifications', 'product_serial_numbers', 'stock_transfers', 'stock_transfer_items'];
  
  for (const table of testTables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        }
      });

      if (response.ok) {
        console.log(`✅ ${table} - accessible`);
      } else {
        const errorText = await response.text();
        if (errorText.includes('does not exist')) {
          console.log(`❌ ${table} - does not exist`);
        } else {
          console.log(`⚠️  ${table} - ${errorText.substring(0, 100)}...`);
        }
      }
    } catch (error) {
      console.log(`❌ ${table} - error: ${error.message}`);
    }
  }

  console.log('\n🎉 Table creation process completed!');
  console.log('\nNext step: Run test script');
  console.log('node scripts/test-system-after-setup.js');
}

createTablesViaHTTP();