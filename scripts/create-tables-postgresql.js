import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function createTablesPostgreSQL() {
  console.log('🚀 Creating tables using PostgreSQL approach...\n');

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

  try {
    // ลองใช้ Supabase Edge Functions หรือ Database Functions
    console.log('1. Attempting to create tables using alternative methods...');

    // วิธีที่ 1: ลองสร้างตารางโดยใช้ INSERT/SELECT patterns
    console.log('\nMethod 1: Testing table creation via data operations...');

    // ทดสอบการสร้าง notifications table โดยการ INSERT ข้อมูลทดสอบ
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          type: 'transfer_created',
          title: 'Test',
          message: 'Test message'
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ notifications table does not exist - need to create manually');
        } else {
          console.log('⚠️  notifications table exists but has issues:', error.message);
        }
      } else {
        console.log('✅ notifications table exists and working');
        // ลบ test data
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', data.id);
      }
    } catch (error) {
      console.log('❌ Error testing notifications table:', error.message);
    }

    // วิธีที่ 2: ลองใช้ Database URL โดยตรง (ถ้ามี)
    console.log('\nMethod 2: Checking for direct database access...');
    
    // ตรวจสอบว่ามี DATABASE_URL หรือไม่
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL found - could use direct PostgreSQL connection');
      console.log('   (This would require pg library)');
    } else {
      console.log('❌ No DATABASE_URL found');
    }

    // วิธีที่ 3: แสดง SQL ที่สะอาดสำหรับ copy-paste
    console.log('\nMethod 3: Providing clean SQL for manual execution...');
    
    const cleanSQL = `
-- Enhanced Transfer System - Complete Setup
-- Copy and paste this into Supabase SQL Editor
-- URL: https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql

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

-- 2. Create product_serial_numbers table
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

-- 3. Create stock_transfers table
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

-- 4. Create stock_transfer_items table
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

-- 5. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serial_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Warehouse staff can access serial numbers" ON public.product_serial_numbers FOR ALL USING (EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')));
CREATE POLICY "Warehouse staff can access transfers" ON public.stock_transfers FOR ALL USING (EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')));
CREATE POLICY "Warehouse staff can access transfer items" ON public.stock_transfer_items FOR ALL USING (EXISTS (SELECT 1 FROM employee_profiles ep WHERE ep.user_id = auth.uid() AND ep.role IN ('admin', 'warehouse_manager', 'warehouse_staff')));

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

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

-- 8. Create helper function
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
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 9) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM stock_transfers
    WHERE transfer_number LIKE 'TF' || year_part || month_part || '%';
    
    transfer_number := 'TF' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
    RETURN transfer_number;
END;
$$ LANGUAGE plpgsql;

-- 9. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.product_serial_numbers TO authenticated;
GRANT ALL ON public.stock_transfers TO authenticated;
GRANT ALL ON public.stock_transfer_items TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transfer_number() TO authenticated;

-- 10. Insert sample data (optional)
INSERT INTO public.product_serial_numbers (serial_number, product_id, warehouse_id, unit_cost, status)
SELECT 
    'SAMPLE-' || generate_random_uuid()::text,
    p.id,
    w.id,
    1000,
    'available'
FROM products p
CROSS JOIN warehouses w
WHERE p.is_active = true AND w.status = 'active'
LIMIT 5
ON CONFLICT (serial_number) DO NOTHING;

SELECT 'Enhanced Transfer System setup completed!' as result;
    `;

    console.log('\n' + '='.repeat(100));
    console.log('📋 COPY THIS SQL TO SUPABASE DASHBOARD:');
    console.log('='.repeat(100));
    console.log(cleanSQL);
    console.log('='.repeat(100));

    console.log('\n🔗 Supabase SQL Editor:');
    console.log('https://hartshwcchbsnmbrjdyn.supabase.co/project/hartshwcchbsnmbrjdyn/sql');

    console.log('\n📝 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste the SQL and click "Run"');
    console.log('4. Wait for completion');
    console.log('5. Run: node scripts/test-system-after-setup.js');

    // ทดสอบสถานะปัจจุบัน
    console.log('\n🔍 Current database state:');
    const testTables = ['notifications', 'product_serial_numbers', 'stock_transfers', 'products', 'warehouses'];
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${table} - does not exist`);
          } else {
            console.log(`⚠️  ${table} - ${error.message.substring(0, 50)}...`);
          }
        } else {
          console.log(`✅ ${table} - exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table} - error: ${err.message}`);
      }
    }

    console.log('\n🎯 Summary:');
    console.log('Since automatic table creation via API is not available,');
    console.log('please use the manual SQL method above.');
    console.log('This is the most reliable way to create the tables.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTablesPostgreSQL();