import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

async function createTablesDirectly() {
  console.log('🚀 Creating tables directly with service role...\n');

  try {
    // 1. สร้างตาราง notifications โดยตรง
    console.log('1. Creating notifications table...');
    
    // ใช้ raw SQL query ผ่าน supabase client
    const { data, error } = await supabaseAdmin
      .from('_temp_table_creation')
      .select('1')
      .limit(0);

    // เนื่องจากไม่สามารถใช้ raw SQL ได้ ให้ลองสร้างตารางผ่าน schema
    console.log('Attempting to create table via schema manipulation...');

    // ลองใช้ PostgreSQL connection string โดยตรง
    const connectionString = `postgresql://postgres.hartshwcchbsnmbrjdyn:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    
    console.log('❌ Cannot execute raw SQL through Supabase client');
    console.log('\n📋 Manual Setup Required:');
    console.log('Please go to Supabase Dashboard and run the following SQL:');
    
    const sql = `
-- 1. Create notifications table
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

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
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

-- 4. Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- 5. Create warehouse system tables (if not exist)
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

-- 6. Enable RLS on warehouse tables
ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for warehouse tables
CREATE POLICY "Warehouse staff can access serial numbers" 
ON public.product_serial_numbers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Warehouse staff can access transfers" 
ON public.stock_transfers 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

CREATE POLICY "Warehouse staff can access transfer items" 
ON public.stock_transfer_items 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM employee_profiles ep 
    WHERE ep.user_id = auth.uid() 
    AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')
));

-- 8. Create indexes for warehouse tables
CREATE INDEX idx_product_serial_numbers_serial_number ON public.product_serial_numbers(serial_number);
CREATE INDEX idx_product_serial_numbers_product_id ON public.product_serial_numbers(product_id);
CREATE INDEX idx_product_serial_numbers_warehouse_id ON public.product_serial_numbers(warehouse_id);
CREATE INDEX idx_product_serial_numbers_status ON public.product_serial_numbers(status);

CREATE INDEX idx_stock_transfers_source_warehouse ON public.stock_transfers(source_warehouse_id);
CREATE INDEX idx_stock_transfers_target_warehouse ON public.stock_transfers(target_warehouse_id);
CREATE INDEX idx_stock_transfers_status ON public.stock_transfers(status);
CREATE INDEX idx_stock_transfers_transfer_number ON public.stock_transfers(transfer_number);

CREATE INDEX idx_stock_transfer_items_transfer_id ON public.stock_transfer_items(transfer_id);
CREATE INDEX idx_stock_transfer_items_serial_number_id ON public.stock_transfer_items(serial_number_id);

-- 9. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.product_serial_numbers TO authenticated;
GRANT ALL ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfer_items TO authenticated;
    `;

    console.log('\n' + '='.repeat(100));
    console.log(sql);
    console.log('='.repeat(100));
    console.log('\n🔗 Supabase SQL Editor: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');
    
    console.log('\n📝 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Run: node scripts/test-enhanced-transfer-system.js');

    // ทดสอบการเชื่อมต่อ
    console.log('\n🔍 Testing current database state...');
    
    const tables = ['notifications', 'product_serial_numbers', 'stock_transfers', 'products', 'warehouses'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${table} - does not exist`);
          } else {
            console.log(`⚠️  ${table} - ${error.message}`);
          }
        } else {
          console.log(`✅ ${table} - exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table} - error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTablesDirectly();